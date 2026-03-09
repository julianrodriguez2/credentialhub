from functools import lru_cache
from typing import Protocol

import boto3
from botocore.client import BaseClient

from app.core.config import settings


class StorageService(Protocol):
    def upload_document(self, key: str, data: bytes, content_type: str) -> str:
        ...

    def delete_document(self, key: str) -> None:
        ...


class S3StorageService:
    def __init__(self) -> None:
        self.client: BaseClient = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        )
        self.bucket = settings.S3_BUCKET

    def upload_document(self, key: str, data: bytes, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

        if settings.S3_ENDPOINT_URL:
            base_url = settings.S3_ENDPOINT_URL.rstrip("/")
            return f"{base_url}/{self.bucket}/{key}"

        return f"https://{self.bucket}.s3.{settings.S3_REGION}.amazonaws.com/{key}"

    def delete_document(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)


class NullStorageService:
    def upload_document(self, key: str, data: bytes, content_type: str) -> str:
        raise RuntimeError(
            "Storage provider is disabled. Configure S3 settings to enable document uploads."
        )

    def delete_document(self, key: str) -> None:
        return None


@lru_cache
def get_storage_service() -> StorageService:
    if settings.STORAGE_PROVIDER.lower() == "s3":
        return S3StorageService()
    return NullStorageService()