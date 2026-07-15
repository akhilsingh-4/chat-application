import asyncio

from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self,
        user_id: str,
        websocket: WebSocket,
        subprotocol: str | None = None,
    ):
        await websocket.accept(subprotocol=subprotocol)
        async with self._lock:
            online_user_ids = list(self.active_connections.keys())
            user_connections = self.active_connections.setdefault(user_id, set())
            was_offline = not user_connections
            user_connections.add(websocket)

        for online_user_id in online_user_ids:
            await websocket.send_json(
                {"type": "presence", "user_id": online_user_id, "status": "online"}
            )

        if was_offline:
            await self.broadcast_user_status(user_id=user_id, status="online")

    async def disconnect(self, user_id: str, websocket: WebSocket | None = None):
        async with self._lock:
            user_connections = self.active_connections.get(user_id)
            if not user_connections:
                return

            if websocket:
                user_connections.discard(websocket)
            else:
                user_connections.clear()

            is_offline = not user_connections
            if is_offline:
                self.active_connections.pop(user_id, None)

        if is_offline:
            await self.broadcast_user_status(user_id=user_id, status="offline")

    async def send_personal_message(self, receiver_id: str, message: dict):
        async with self._lock:
            receiver_sockets = list(self.active_connections.get(receiver_id, set()))

        for receiver_socket in receiver_sockets:
            try:
                await receiver_socket.send_json(message)
            except RuntimeError:
                await self.disconnect(receiver_id, receiver_socket)

    async def broadcast_to_users(self, user_ids: list[str], message: dict):
      
        async with self._lock:
            targets = [
                (user_id, websocket)
                for user_id in user_ids
                for websocket in self.active_connections.get(user_id, set())
            ]

        for user_id, websocket in targets:
            try:
                await websocket.send_json(message)
            except RuntimeError:
                await self.disconnect(user_id, websocket)

    async def send_group_typing_status(
        self, group_id: str, member_ids: list[str], sender_id: str, is_typing: bool
    ):
        await self.broadcast_to_users(
            member_ids,
            {
                "type": "typing",
                "group_id": group_id,
                "sender_id": sender_id,
                "is_typing": is_typing,
            },
        )

    async def broadcast(self, message: dict):
        async with self._lock:
            connections = [
                (user_id, websocket)
                for user_id, sockets in self.active_connections.items()
                for websocket in sockets
            ]

        for user_id, websocket in connections:
            try:
                await websocket.send_json(message)
            except RuntimeError:
                await self.disconnect(user_id, websocket)

    async def broadcast_user_status(self, user_id: str, status: str):
        await self.broadcast({"type": "presence", "user_id": user_id, "status": status})

    async def send_typing_status(self, receiver_id: str, sender_id: str, is_typing: bool):
        await self.send_personal_message(
            receiver_id,
            {"type": "typing", "sender_id": sender_id, "is_typing": is_typing}, 
        )

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections

    def get_online_users(self) -> list[str]:
        return list(self.active_connections.keys())


manager = ConnectionManager()
