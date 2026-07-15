import logging
from uuid import UUID, uuid4

from app.core.config import settings

logger = logging.getLogger(__name__)


class S3ConfigurationError(Exception):
    pass


class S3UploadError(Exception):
    pass


class S3Service:
    def __init__(self):
        self.bucket_name = settings.AWS_S3_BUCKET_NAME
        self.region_name = settings.AWS_REGION
        self.expires_in = settings.AWS_S3_PRESIGNED_URL_EXPIRES_SECONDS

        if not all(
            [
                settings.AWS_ACCESS_KEY_ID,
                settings.AWS_SECRET_ACCESS_KEY,
                self.region_name,
                self.bucket_name,
            ]
        ):
            self.client = None
            self.configuration_error = None
            return

        try:
            import boto3
        except ImportError as exc:
            self.client = None
            self.configuration_error = (
                "boto3 is not installed. Install backend requirements before uploading attachments."
            )
            return

        endpoint_url = settings.AWS_S3_ENDPOINT_URL or f"https://s3.{self.region_name}.amazonaws.com"

        self.configuration_error = None
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self.region_name,
            endpoint_url=endpoint_url,
        )

    def is_configured(self) -> bool:
        return self.client is not None and bool(self.bucket_name)

    def _ensure_configured(self):
        if self.configuration_error:
            raise S3ConfigurationError(self.configuration_error)
        if not self.is_configured():
            raise S3ConfigurationError("Amazon S3 is not configured.")

    def build_object_key(
        self,
        *,
        sender_id: UUID,
        receiver_id: UUID | None,
        group_id: UUID | None,
        extension: str,
    ) -> str:
        file_id = uuid4()
        clean_extension = extension.lower() if extension else ""

        if group_id:
            return f"chat-attachments/groups/{group_id}/{sender_id}/{file_id}{clean_extension}"

        return f"chat-attachments/private/{sender_id}/{receiver_id}/{file_id}{clean_extension}"

    def upload_file(
        self,
        *,
        file_content: bytes,
        object_key: str,
        content_type: str,
        file_name: str,
    ) -> str:
        self._ensure_configured()

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={"original-file-name": file_name[:1024]},
            )
        except Exception as exc:
            logger.exception("Unable to upload chat attachment to S3 key=%s", object_key)
            raise S3UploadError("Unable to upload attachment.") from exc

        return object_key

    def generate_download_url(self, object_key: str) -> str | None:
        if not object_key or not self.is_configured():
            return None

        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": object_key},
                ExpiresIn=self.expires_in,
            )
        except Exception:
            logger.exception("Unable to generate S3 download URL key=%s", object_key)
            return None

    def delete_file(self, object_key: str):
        if not object_key or not self.is_configured():
            return

        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
        except Exception:
            logger.exception("Unable to delete S3 object key=%s", object_key)