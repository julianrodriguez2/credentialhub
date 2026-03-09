from datetime import date

from pydantic import BaseModel

from app.models.credential import CredentialType


class PublicCredentialRead(BaseModel):
    credential_name: str
    credential_type: CredentialType
    issuing_organization: str
    expiration_date: date | None
    status: str


class PublicWorkExperienceRead(BaseModel):
    company_name: str
    role_title: str
    description: str
    start_date: date
    end_date: date | None
    equipment_used: str


class PublicCompetencyRead(BaseModel):
    competency_name: str
    years_experience: int
    certification_related: str | None


class PublicWorkerProfileRead(BaseModel):
    public_slug: str
    full_name: str
    bio: str
    years_experience: int
    compliance_status: str
    competencies: list[PublicCompetencyRead]
    work_experiences: list[PublicWorkExperienceRead]
    credentials: list[PublicCredentialRead]
    generated_resume_text: str | None
