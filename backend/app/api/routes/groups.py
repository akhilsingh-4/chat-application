from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps_auth import get_current_user
from app.exceptions.group import GroupNotFoundException, UserAlreadyMemberException
from app.models.user import User
from app.schemas.group import (
    AddMemberRequest,
    GroupCreate,
    GroupResponse,
    GroupMemberResponse,
)
from app.schemas.message import MessageResponse
from app.services.group_serivce import GroupService
from app.services.message_service import MessageService

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post(
    "",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_group(
    request: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    try:
        return group_service.create_group(
            name=request.name,
            description=request.description,
            created_by=current_user.id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get(
    "",
    response_model=list[GroupResponse],
)
def get_user_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    return group_service.get_user_groups(current_user.id)


@router.get(
    "/{group_id}",
    response_model=GroupResponse,
)
def get_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    try:
        return group_service.ensure_member(group_id, current_user.id)
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.post(
    "/{group_id}/members",
    response_model=GroupMemberResponse,
)
def add_member(
    group_id: UUID,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    try:
        group = group_service.get_group(group_id)
        if group.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group creator can add members.",
            )
        return group_service.add_member(
            group_id=group_id,
            user_id=request.user_id,
        )
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except UserAlreadyMemberException as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/{group_id}/members",
    response_model=list[GroupMemberResponse],
)
def get_group_members(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    try:
        group_service.ensure_member(group_id, current_user.id)
        return group_service.get_group_members(group_id)
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.get(
    "/{group_id}/messages",
    response_model=list[MessageResponse],
)
def get_group_messages(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)
    message_service = MessageService(db)

    try:
        group_service.ensure_member(group_id, current_user.id)
        return [
            message_service.build_message_response(message)
            for message in message_service.get_group_history(group_id)
        ]
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
    group_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    try:
        group = group_service.get_group(group_id)
        if group.created_by != current_user.id and current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group creator can remove members.",
            )
        group_service.remove_member(
            group_id=group_id,
            user_id=user_id,
        )
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except UserAlreadyMemberException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_service = GroupService(db)

    try:
        group_service.delete_group(
            group_id=group_id,
            requested_by=current_user.id,
        )
    except GroupNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
