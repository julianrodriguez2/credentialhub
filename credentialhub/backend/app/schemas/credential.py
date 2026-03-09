from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.credential import CredentialType


class CredentialRead(BaseModel):
    id: UUID
    worker_id: int
    credential_name: str
    credential_type: CredentialType
    issuing_organization: str
    issue_date: date
    expiration_date: date | None
    document_url: str
    created_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


class CredentialUploadPayload(BaseModel):
    credential_name: str = Field(min_length=1, max_length=255)
    credential_type: CredentialType
    issuing_organization: str = Field(min_length=1, max_length=255)
    issue_date: date
    expiration_date: date | None = None
