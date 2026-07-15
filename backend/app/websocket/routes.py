from uuid import UUID
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.api.deps import get_db
from app.core.security import decode_token
from app.exceptions.group import GroupNotFoundException
from app.models.user import User
from app.services.group_serivce import GroupService
from app.services.message_service import MessageService
from app.websocket.manager import manager
from app.services.s3_service import S3Service

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_token_user(db, token: str | None) -> User | None:
    if not token:
        logger.warning("WebSocket auth failed: missing token")
        return None
    try:
        payload = decode_token(token)
        if payload.get("token_type") != "access":
            logger.warning("WebSocket auth failed: invalid token_type")
            return None
        user_id = UUID(str(payload.get("sub")))
    except (TypeError, ValueError):
        logger.warning("WebSocket auth failed: invalid token payload")
        return None
    return db.query(User).filter(User.id == user_id).first()


def _get_websocket_token(websocket: WebSocket) -> str | None:
    query_token = websocket.query_params.get("token")
    if query_token:
        return query_token

    protocol_header = websocket.headers.get("sec-websocket-protocol", "")
    protocols = [protocol.strip() for protocol in protocol_header.split(",")]
    for index, protocol in enumerate(protocols):
        if protocol.lower() == "bearer" and index + 1 < len(protocols):
            return protocols[index + 1]

    return None


def _accepts_bearer_subprotocol(websocket: WebSocket) -> bool:
    protocol_header = websocket.headers.get("sec-websocket-protocol", "")
    return any(
        protocol.strip().lower() == "bearer"
        for protocol in protocol_header.split(",")
    )


async def _close_policy_violation(websocket: WebSocket, reason: str, **context):
    logger.warning("WebSocket rejected: %s context=%s", reason, context)
    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    try:
        sender_id = UUID(user_id)
    except ValueError:
        await _close_policy_violation(websocket, "invalid user_id", user_id=user_id)
        return

    db_context = get_db()
    db = next(db_context)
    try:
        token_user = _get_token_user(db, _get_websocket_token(websocket))
        if not token_user:
            await _close_policy_violation(websocket, "missing or invalid token", user_id=user_id)
            return

        if token_user.id != sender_id:
            await _close_policy_violation(
                websocket, "token user mismatch", path_user_id=user_id, token_user_id=str(token_user.id)
            )
            return

        message_service = MessageService(db, S3Service())
        group_service = GroupService(db)
        await manager.connect(
            user_id,
            websocket,
            subprotocol="bearer" if _accepts_bearer_subprotocol(websocket) else None,
        )
        logger.info("WebSocket connected for user_id=%s", user_id)

        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "private_message")

            # --- Private typing ---
            if event_type == "typing":
                try:
                    receiver_id = UUID(str(data["receiver_id"]))
                except (KeyError, ValueError):
                    await websocket.send_json({"error": "Invalid typing payload."})
                    continue

                await manager.send_typing_status(
                    receiver_id=str(receiver_id),
                    sender_id=user_id,
                    is_typing=bool(data.get("is_typing")),
                )
                continue

            # --- Group typing ---
            if event_type == "group_typing":
                try:
                    group_id = UUID(str(data["group_id"]))
                except (KeyError, ValueError):
                    await websocket.send_json({"error": "Invalid group typing payload."})
                    continue

                try:
                    group_service.ensure_member(group_id, sender_id)
                    member_ids = [
                        str(member.user_id)
                        for member in group_service.get_group_members(group_id)
                    ]
                except (GroupNotFoundException, PermissionError):
                    await websocket.send_json({"error": "Not a member of this group."})
                    continue

                await manager.send_group_typing_status(
                    group_id=str(group_id),
                    member_ids=member_ids,
                    sender_id=user_id,
                    is_typing=bool(data.get("is_typing")),
                )
                continue

            # --- Group message ---
            if event_type == "group_message":
                try:
                    group_id = UUID(str(data["group_id"]))
                    content = str(data.get("text") or data.get("content") or "").strip()
                except (KeyError, ValueError):
                    await websocket.send_json({"error": "Invalid group message payload."})
                    continue

                if not content:
                    await websocket.send_json({"error": "Message content cannot be empty."})
                    continue

                try:
                    group_service.ensure_member(group_id, sender_id)
                    member_ids = [
                        str(member.user_id)
                        for member in group_service.get_group_members(group_id)
                    ]
                    saved_message = message_service.send_group_message(
                        sender_id=sender_id, group_id=group_id, content=content
                    )
                except (GroupNotFoundException, PermissionError) as exc:
                    await websocket.send_json({"error": str(exc)})
                    continue
                except Exception as exc:
                    db.rollback()
                    logger.exception(
                        "Unable to send group message group_id=%s user_id=%s", group_id, user_id
                    )
                    await websocket.send_json(
                        {"type": "error", "error": "Unable to send group message.", "detail": str(exc)}
                    )
                    continue

                response = message_service.serialize_message(saved_message, client_id=data.get("client_id"))
                response["type"] = "group_message"

                await manager.broadcast_to_users(member_ids, response)
                continue

            # --- Private message (default) ---
            if event_type != "private_message":
                await websocket.send_json({"error": "Unsupported message type."})
                continue

            try:
                receiver_id = UUID(str(data["receiver_id"]))
                content = str(data.get("text") or data.get("content") or "").strip()
            except (KeyError, ValueError):
                await websocket.send_json({"error": "Invalid message payload."})
                continue

            if not content:
                await websocket.send_json({"error": "Message content cannot be empty."})
                continue

            try:
                saved_message = message_service.send_message(
                    sender_id=sender_id, receiver_id=receiver_id, content=content
                )
            except Exception:
                db.rollback()
                await websocket.send_json({"error": "Unable to send message."})
                continue

            response = message_service.serialize_message(saved_message, client_id=data.get("client_id"))
            response["type"] = "private_message"

            await manager.send_personal_message(str(receiver_id), response)
            await manager.send_personal_message(user_id, response)

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket failed for user_id=%s", user_id)
    finally:
        await manager.disconnect(user_id, websocket)
        db_context.close()
        logger.info("WebSocket disconnected for user_id=%s", user_id)
