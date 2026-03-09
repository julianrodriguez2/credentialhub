import enum
from datetime import date

from pydantic import BaseModel

from app.models.credential import CredentialType


class CredentialStatusFilter(str, enum.Enum):
    valid = "valid"
    expiring = "expiring"
    expired = "expired"


class CredentialSummary(BaseModel):
    valid: int = 0
    expiring: int = 0
    expired: int = 0
    total: int = 0


class EmployerWorkerListItem(BaseModel):
    worker_id: int
    full_name: str
    years_experience: int
    top_competencies: list[str]
    credential_summary: CredentialSummary
    profile_visibility: bool


class EmployerCredentialRead(BaseModel):
    credential_name: str
    credential_type: CredentialType
    issuing_organization: str
    expiration_date: date | None
    status: str


class EmployerWorkExperienceRead(BaseModel):
    company_name: str
    role_title: str
    description: str
    start_date: date
    end_date: date | None
    equipment_used: str


class EmployerCompetencyRead(BaseModel):
    competency_name: str
    years_experience: int
    certification_related: str | None


class EmployerReferenceRead(BaseModel):
    reference_name: str
    company: str
    position: str
    relationship: str
    verified: bool


class EmployerWorkerProfileRead(BaseModel):
    worker_id: int
    full_name: str
    bio: str
    years_experience: int
    profile_visibility: bool
    work_experiences: list[EmployerWorkExperienceRead]
    competencies: list[EmployerCompetencyRead]
    references: list[EmployerReferenceRead]
    credentials: list[EmployerCredentialRead]
