from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user import User, UserRole
from app.models.worker_profile import WorkerProfile
from app.schemas.public_profile import (
    PublicCompetencyRead,
    PublicCredentialRead,
    PublicWorkExperienceRead,
    PublicWorkerProfileRead,
)
from app.utils.credential_status import get_credential_status


def _serialize_public_credential(credential) -> PublicCredentialRead:
    return PublicCredentialRead(
        credential_name=credential.credential_name,
        credential_type=credential.credential_type,
        issuing_organization=credential.issuing_organization,
        expiration_date=credential.expiration_date,
        status=get_credential_status(credential.expiration_date),
    )


def get_public_worker_profile_by_slug(
    db: Session, public_slug: str
) -> PublicWorkerProfileRead | None:
    profile = db.scalar(
        select(WorkerProfile)
        .join(User, User.id == WorkerProfile.user_id)
        .where(
            User.role == UserRole.worker,
            WorkerProfile.profile_visibility.is_(True),
            WorkerProfile.public_slug == public_slug,
        )
        .options(
            selectinload(WorkerProfile.user).selectinload(User.work_experiences),
            selectinload(WorkerProfile.user).selectinload(User.competencies),
            selectinload(WorkerProfile.user).selectinload(User.credentials),
            selectinload(WorkerProfile.user).selectinload(User.generated_resumes),
        )
    )
    if profile is None or profile.public_slug is None:
        return None

    experiences = [
        PublicWorkExperienceRead(
            company_name=item.company_name,
            role_title=item.role_title,
            description=item.description,
            start_date=item.start_date,
            end_date=item.end_date,
            equipment_used=item.equipment_used,
        )
        for item in sorted(
            profile.user.work_experiences,
            key=lambda value: value.start_date,
            reverse=True,
        )
    ]

    competencies = [
        PublicCompetencyRead(
            competency_name=item.competency_name,
            years_experience=item.years_experience,
            certification_related=item.certification_related,
        )
        for item in sorted(
            profile.user.competencies,
            key=lambda value: (-value.years_experience, value.competency_name.lower()),
        )
    ]

    credentials = [
        _serialize_public_credential(item)
        for item in sorted(
            profile.user.credentials,
            key=lambda value: value.created_at,
            reverse=True,
        )
    ]

    latest_resume = next(
        iter(
            sorted(
                profile.user.generated_resumes,
                key=lambda value: value.created_at,
                reverse=True,
            )
        ),
        None,
    )

    return PublicWorkerProfileRead(
        public_slug=profile.public_slug,
        full_name=profile.full_name,
        bio=profile.bio,
        years_experience=profile.years_experience,
        compliance_status=profile.compliance_status,
        competencies=competencies,
        work_experiences=experiences,
        credentials=credentials,
        generated_resume_text=latest_resume.resume_text if latest_resume else None,
    )
