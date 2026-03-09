from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkerProfileRead(BaseModel):
    id: int
    user_id: int
    full_name: str
    bio: str
    years_experience: int
    profile_visibility: bool
    compliance_status: str
    last_compliance_check: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkerProfileUpdate(BaseModel):
    full_name: str = Field(default="", max_length=255)
    bio: str = Field(default="", max_length=5000)
    years_experience: int = Field(default=0, ge=0, le=80)
    profile_visibility: bool = False
