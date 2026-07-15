from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    DATABASE_URL: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    SECRET_KEY: str

    FRONTEND_URL: str
    BACKEND_URL: str
    CORS_ORIGINS: str = ""

    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str | None = None
    AWS_S3_BUCKET_NAME: str | None = None
    AWS_S3_ENDPOINT_URL: str | None = None
    AWS_S3_PRESIGNED_URL_EXPIRES_SECONDS: int = 3600
    CHAT_ATTACHMENT_MAX_SIZE_MB: int = 25

settings = Settings()
