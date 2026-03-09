from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user import User, UserRole
from app.models.worker_profile import WorkerProfile
from app.schemas.employer import (
    CredentialStatusFilter,
    CredentialSummary,
    EmployerCompetencyRead,
    EmployerCredentialRead,
    EmployerReferenceRead,
    EmployerWorkExperienceRead,
    EmployerWorkerListItem,
    EmployerWorkerProfileRead,
)
from app.services.credential_status_service import get_credential_status


def build_credential_summary(credentials: list[EmployerCredentialRead]) -> CredentialSummary:
    summary = CredentialSummary()
    for credential in credentials:
        summary.total += 1
        if credential.status == "valid":
            summary.valid += 1
        elif credential.status == "expiring":
            summary.expiring += 1
        elif credential.status == "expired":
            summary.expired += 1
    return summary


def _serialize_credential(credential) -> EmployerCredentialRead:
    return EmployerCredentialRead(
        credential_name=credential.credential_name,
        credential_type=credential.credential_type,
        issuing_organization=credential.issuing_organization,
        expiration_date=credential.expiration_date,
        status=get_credential_status(credential.expiration_date),
    )


def list_visible_workers(
    db: Session,
    search: str | None = None,
    competency: str | None = None,
    years_experience: int | None = None,
    credential_status: CredentialStatusFilter | None = None,
) -> list[EmployerWorkerListItem]:
    query = (
        select(WorkerProfile)
        .join(User, User.id == WorkerProfile.user_id)
        .where(
            User.role == UserRole.worker,
            WorkerProfile.profile_visibility.is_(True),
        )
        .options(
            selectinload(WorkerProfile.user).selectinload(User.competencies),
            selectinload(WorkerProfile.user).selectinload(User.credentials),
        )
    )
    profiles = list(db.scalars(query))

    search_term = search.lower().strip() if search else None
    competency_term = competency.lower().strip() if competency else None

    items: list[EmployerWorkerListItem] = []
    for profile in profiles:
        competencies = list(profile.user.competencies)
        credentials = [_serialize_credential(item) for item in profile.user.credentials]

        if years_experience is not None and profile.years_experience < years_experience:
            continue

        if search_term:
            in_name = search_term in profile.full_name.lower()
            in_competencies = any(
                search_term in item.competency_name.lower() for item in competencies
            )
            if not in_name and not in_competencies:
                continue

        if competency_term and not any(
            competency_term in item.competency_name.lower() for item in competencies
        ):
            continue

        if credential_status and not any(
            item.status == credential_status.value for item in credentials
        ):
            continue

        top_competencies = [
            item.competency_name
            for item in sorted(
                competencies,
                key=lambda value: (-value.years_experience, value.competency_name.lower()),
            )[:3]
        ]

        items.append(
            EmployerWorkerListItem(
                worker_id=profile.user_id,
                full_name=profile.full_name,
                years_experience=profile.years_experience,
                top_competencies=top_competencies,
                credential_summary=build_credential_summary(credentials),
                profile_visibility=profile.profile_visibility,
            )
        )

    return sorted(items, key=lambda item: item.full_name.lower())


def get_visible_worker_profile(
    db: Session, worker_id: int
) -> EmployerWorkerProfileRead | None:
    profile = db.scalar(
        select(WorkerProfile)
        .join(User, User.id == WorkerProfile.user_id)
        .where(
            WorkerProfile.user_id == worker_id,
            WorkerProfile.profile_visibility.is_(True),
            User.role == UserRole.worker,
        )
        .options(
            selectinload(WorkerProfile.user).selectinload(User.work_experiences),
            selectinload(WorkerProfile.user).selectinload(User.competencies),
            selectinload(WorkerProfile.user).selectinload(User.references),
            selectinload(WorkerProfile.user).selectinload(User.credentials),
        )
    )
    if profile is None:
        return None

    experiences = [
        EmployerWorkExperienceRead(
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
        EmployerCompetencyRead(
            competency_name=item.competency_name,
            years_experience=item.years_experience,
            certification_related=item.certification_related,
        )
        for item in sorted(
            profile.user.competencies,
            key=lambda value: (-value.years_experience, value.competency_name.lower()),
        )
    ]

    references = [
        EmployerReferenceRead(
            reference_name=item.reference_name,
            company=item.company,
            position=item.position,
            relationship=item.relationship,
            verified=item.verified,
        )
        for item in sorted(
            profile.user.references, key=lambda value: value.reference_name.lower()
        )
    ]

    credentials = [
        _serialize_credential(item)
        for item in sorted(
            profile.user.credentials,
            key=lambda value: value.created_at,
            reverse=True,
        )
    ]

    return EmployerWorkerProfileRead(
        worker_id=profile.user_id,
        full_name=profile.full_name,
        bio=profile.bio,
        years_experience=profile.years_experience,
        profile_visibility=profile.profile_visibility,
        work_experiences=experiences,
        competencies=competencies,
        references=references,
        credentials=credentials,
    )
