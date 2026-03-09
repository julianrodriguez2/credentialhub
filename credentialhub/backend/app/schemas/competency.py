from pydantic import BaseModel, ConfigDict, Field


class CompetencyCreate(BaseModel):
    competency_name: str = Field(min_length=1, max_length=255)
    years_experience: int = Field(ge=0, le=80)
    certification_related: str | None = Field(default=None, max_length=255)


class CompetencyRead(CompetencyCreate):
    id: int
    worker_id: int

    model_config = ConfigDict(from_attributes=True)
