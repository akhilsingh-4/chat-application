# app/routers/auth.py
from urllib.parse import urlencode

from authlib.integrations.base_client.errors import MismatchingStateError
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.oauth import oauth
from app.core.config import settings
from app.api.deps import get_db
from app.core.security import create_access_token
from app.repository.user_repository import UserRepository
from app.services.user_service import UserService

router = APIRouter(prefix="/auth")


def _frontend_url(
    path: str = "",
    params: dict | None = None,
    fragment_params: dict | None = None,
) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")
    target = f"{base_url}{path}"
    if params:
        target = f"{target}?{urlencode(params)}"
    if fragment_params:
        target = f"{target}#{urlencode(fragment_params)}"
    return target


@router.get("/google/login")
async def google_login(request: Request):
    request.session.clear()
    return await oauth.google.authorize_redirect(
        request,
        settings.GOOGLE_REDIRECT_URI,
        prompt="select_account",
    )


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db),       
):
    try:
        token = await oauth.google.authorize_access_token(request)
    except MismatchingStateError:
        return RedirectResponse(
            _frontend_url(
                "/",
                {
                    "error": (
                        "Your Google sign-in session expired. "
                        "Please try again from this browser tab."
                    )
                },
            )
        )

    user_info = token.get("userinfo") or await oauth.google.userinfo(token=token)
    google_id = user_info.get("sub")
    email = user_info.get("email")

    if not google_id or not email:
        return RedirectResponse(
            _frontend_url(
                "/",
                {"error": "Google did not return the account details required to sign in."},
            )
        )


    repo = UserRepository(db)
    service = UserService(repo)

    user = service.get_or_create(
        google_id=google_id,
        email=email,
        name=user_info.get("name", ""),
        profile_picture=user_info.get("picture", ""),
    )

    return RedirectResponse(
        _frontend_url(
            "/dashboard",
            fragment_params={
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "picture": user.profile_picture or "",
                "token": create_access_token(user.id),
            },
        )
    )
