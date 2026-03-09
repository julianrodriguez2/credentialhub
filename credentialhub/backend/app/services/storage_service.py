from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from fastapi import UploadFile

from app.core.config import settings

ALLOWED_FILE_CONTENT_TYPES = {
    "application/pdf",
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/webp",
}


class DocumentStorageService:
    def __init__(self) -> None:
        access_key = settings.S3_ACCESS_KEY or settings.S3_ACCESS_KEY_ID
        secret_key = settings.S3_SECRET_KEY or settings.S3_SECRET_ACCESS_KEY
        self.bucket = settings.S3_BUCKET
        self.region = settings.S3_REGION
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.client: BaseClient = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(s3={"addressing_style": "path"}),
        )

    async def upload_file(self, file: UploadFile, key_prefix: str = "credentials") -> str:
        if not file.filename:
            raise ValueError("A file is required.")

        if file.content_type not in ALLOWED_FILE_CONTENT_TYPES:
            raise ValueError("Only PDF and image files are allowed.")

        suffix = Path(file.filename).suffix.lower()
        key = f"{key_prefix.rstrip('/')}/{uuid4()}{suffix}"
        content = await file.read()
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content,
            ContentType=file.content_type,
        )

        if self.endpoint_url:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{key}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"

    def extract_object_key(self, file_url: str) -> str:
        parsed = urlparse(file_url)
        path = parsed.path.lstrip("/")
        if not path:
            raise ValueError("Invalid file URL.")

        if path.startswith(f"{self.bucket}/"):
            key = path[len(self.bucket) + 1 :]
        else:
            key = path

        if not key:
            raise ValueError("Unable to parse object key from URL.")
        return key

    def download_file(self, file_url: str) -> tuple[bytes, str | None]:
        key = self.extract_object_key(file_url)
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        body = response.get("Body")
        if body is None:
            raise ValueError("Unable to read document from storage.")
        content = body.read()
        content_type = response.get("ContentType")
        return content, content_type

    def delete_file(self, file_url: str) -> None:
        key = self.extract_object_key(file_url)
        self.client.delete_object(Bucket=self.bucket, Key=key)


@lru_cache
def get_storage_service() -> DocumentStorageService:
    return DocumentStorageService()
