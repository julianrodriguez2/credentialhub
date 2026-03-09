from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ReferenceCreate(BaseModel):
    reference_name: str = Field(min_length=1, max_length=255)
    company: str = Field(min_length=1, max_length=255)
    position: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=50)
    relationship: str = Field(min_length=1, max_length=255)


class ReferenceRead(ReferenceCreate):
    id: int
    worker_id: int
    verified: bool
    verification_sent_at: datetime | None
    verification_confirmed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ReferenceVerificationSendResponse(BaseModel):
    message: str
    verification_sent_at: datetime


class ReferenceVerificationConfirmResponse(BaseModel):
    message: str
    verified: bool
    verification_confirmed_at: datetime
