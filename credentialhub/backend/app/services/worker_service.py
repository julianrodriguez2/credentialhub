import re
import secrets
import unicodedata
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.competency import Competency
from app.models.reference import Reference
from app.models.work_experience import WorkExperience
from app.models.worker_profile import WorkerProfile
from app.schemas.competency import CompetencyCreate
from app.schemas.reference import ReferenceCreate
from app.schemas.work_experience import WorkExperienceCreate, WorkExperienceUpdate
from app.schemas.worker_profile import WorkerProfileUpdate


def _slugify(value: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    return slug or "worker"


def _generate_unique_public_slug(db: Session, full_name: str) -> str:
    base_slug = _slugify(full_name)
    for _ in range(20):
        candidate = f"{base_slug}-{secrets.randbelow(9000) + 1000}"
        exists = db.scalar(
            select(WorkerProfile.id).where(WorkerProfile.public_slug == candidate)
        )
        if exists is None:
            return candidate

    fallback = f"{base_slug}-{uuid4().hex[:8]}"
    exists = db.scalar(select(WorkerProfile.id).where(WorkerProfile.public_slug == fallback))
    if exists is None:
        return fallback
    return f"{base_slug}-{uuid4().hex}"


def get_or_create_worker_profile(db: Session, worker_id: int) -> WorkerProfile:
    profile = db.scalar(
        select(WorkerProfile).where(WorkerProfile.user_id == worker_id)
    )

    if profile is None:
        profile = WorkerProfile(
            user_id=worker_id,
            full_name="",
            bio="",
            years_experience=0,
            profile_visibility=False,
            compliance_status="incomplete",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif profile.profile_visibility and not profile.public_slug:
        profile.public_slug = _generate_unique_public_slug(db, profile.full_name)
        db.commit()
        db.refresh(profile)

    return profile


def update_worker_profile(
    db: Session,
    worker_id: int,
    payload: WorkerProfileUpdate,
) -> WorkerProfile:
    profile = get_or_create_worker_profile(db, worker_id)
    profile.full_name = payload.full_name
    profile.bio = payload.bio
    profile.years_experience = payload.years_experience
    profile.profile_visibility = payload.profile_visibility

    if profile.profile_visibility and not profile.public_slug:
        profile.public_slug = _generate_unique_public_slug(db, payload.full_name)

    db.commit()
    db.refresh(profile)
    return profile


def list_work_experiences(db: Session, worker_id: int) -> list[WorkExperience]:
    return list(
        db.scalars(
            select(WorkExperience)
            .where(WorkExperience.worker_id == worker_id)
            .order_by(WorkExperience.created_at.desc())
        )
    )


def add_work_experience(
    db: Session,
    worker_id: int,
    payload: WorkExperienceCreate,
) -> WorkExperience:
    experience = WorkExperience(worker_id=worker_id, **payload.model_dump())
    db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience


def update_work_experience(
    db: Session,
    worker_id: int,
    payload: WorkExperienceUpdate,
) -> WorkExperience | None:
    experience = db.scalar(
        select(WorkExperience).where(
            WorkExperience.id == payload.id,
            WorkExperience.worker_id == worker_id,
        )
    )
    if experience is None:
        return None

    values = payload.model_dump(exclude={"id"})
    for key, value in values.items():
        setattr(experience, key, value)

    db.commit()
    db.refresh(experience)
    return experience


def delete_work_experience(db: Session, worker_id: int, experience_id: UUID) -> bool:
    experience = db.scalar(
        select(WorkExperience).where(
            WorkExperience.id == experience_id,
            WorkExperience.worker_id == worker_id,
        )
    )
    if experience is None:
        return False

    db.delete(experience)
    db.commit()
    return True


def list_competencies(db: Session, worker_id: int) -> list[Competency]:
    return list(
        db.scalars(
            select(Competency)
            .where(Competency.worker_id == worker_id)
            .order_by(Competency.id.desc())
        )
    )


def add_competency(db: Session, worker_id: int, payload: CompetencyCreate) -> Competency:
    competency = Competency(worker_id=worker_id, **payload.model_dump())
    db.add(competency)
    db.commit()
    db.refresh(competency)
    return competency


def delete_competency(db: Session, worker_id: int, competency_id: int) -> bool:
    competency = db.scalar(
        select(Competency).where(
            Competency.id == competency_id,
            Competency.worker_id == worker_id,
        )
    )
    if competency is None:
        return False

    db.delete(competency)
    db.commit()
    return True


def list_references(db: Session, worker_id: int) -> list[Reference]:
    return list(
        db.scalars(
            select(Reference)
            .where(Reference.worker_id == worker_id)
            .order_by(Reference.id.desc())
        )
    )


def add_reference(db: Session, worker_id: int, payload: ReferenceCreate) -> Reference:
    reference = Reference(worker_id=worker_id, **payload.model_dump())
    db.add(reference)
    db.commit()
    db.refresh(reference)
    return reference


def delete_reference(db: Session, worker_id: int, reference_id: int) -> bool:
    reference = db.scalar(
        select(Reference).where(
            Reference.id == reference_id,
            Reference.worker_id == worker_id,
        )
    )
    if reference is None:
        return False

    db.delete(reference)
    db.commit()
    return True
