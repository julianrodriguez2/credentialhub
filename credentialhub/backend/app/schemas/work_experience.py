from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkExperienceBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    role_title: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=5000)
    start_date: date
    end_date: date | None = None
    equipment_used: str = Field(default="", max_length=5000)


class WorkExperienceCreate(WorkExperienceBase):
    pass


class WorkExperienceUpdate(WorkExperienceBase):
    id: UUID


class WorkExperienceRead(WorkExperienceBase):
    id: UUID
    worker_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
