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


class ParsedCredentialResult(BaseModel):
    credential_name: str | None = None
    credential_type: CredentialType | None = None
    issuing_organization: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    confidence_score: float | None = None
    raw_extracted_text: str | None = None


class CredentialParseResponse(BaseModel):
    file_url: str
    parsed_fields: ParsedCredentialResult
    parse_warning: str | None = None


class CredentialConfirmPayload(BaseModel):
    file_url: str = Field(min_length=1)
    credential_name: str = Field(min_length=1, max_length=255)
    credential_type: CredentialType
    issuing_organization: str = Field(min_length=1, max_length=255)
    issue_date: date
    expiration_date: date | None = None


class CredentialReparsePayload(BaseModel):
    file_url: str = Field(min_length=1)
