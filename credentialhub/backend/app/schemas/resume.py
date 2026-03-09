from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GeneratedResumeRead(BaseModel):
    id: UUID
    worker_id: int
    resume_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GeneratedResumeResponse(BaseModel):
    resume_text: str
