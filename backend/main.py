from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, message, users, groups
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.websocket.routes import router as websocket_router
app = FastAPI()


def _cors_origins() -> list[str]:
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ]
    if configured_origins:
        return configured_origins

    return [settings.FRONTEND_URL.rstrip("/")]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="lax",
    https_only=False,
    max_age=60 * 15,
)


app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(message.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(websocket_router, prefix="/api")



