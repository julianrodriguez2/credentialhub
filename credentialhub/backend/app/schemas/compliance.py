from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.credential import CredentialType


class CredentialComplianceSummary(BaseModel):
    valid_count: int = 0
    expiring_count: int = 0
    expired_count: int = 0
    total_count: int = 0


class ComplianceCredentialRead(BaseModel):
    id: UUID
    credential_name: str
    credential_type: CredentialType
    issuing_organization: str
    expiration_date: date | None
    status: str


class WorkerComplianceRead(BaseModel):
    compliance_status: str
    last_compliance_check: datetime | None
    credential_summary: CredentialComplianceSummary
    expiring_credentials: list[ComplianceCredentialRead]
    expired_credentials: list[ComplianceCredentialRead]
