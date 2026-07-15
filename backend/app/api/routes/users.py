from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps_auth import get_current_user
from app.models.user import User
from app.repository.user_repository import UserRepository

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = UserRepository(db).get_all_users()

    return [
        {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "profile_picture": user.profile_picture,
        }
        for user in users
    ]
