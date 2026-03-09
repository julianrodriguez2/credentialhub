from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.employer import (
    CredentialStatusFilter,
    EmployerWorkerListItem,
    EmployerWorkerProfileRead,
)
from app.services.employer_service import get_visible_worker_profile, list_visible_workers

router = APIRouter(prefix="/api/employer", tags=["employer"])


@router.get("/workers", response_model=list[EmployerWorkerListItem])
def get_workers(
    search: str | None = Query(default=None),
    competency: str | None = Query(default=None),
    years_experience: int | None = Query(default=None, ge=0),
    credential_status: CredentialStatusFilter | None = Query(default=None),
    _: User = Depends(require_roles(UserRole.employer)),
    db: Session = Depends(get_db),
) -> list[EmployerWorkerListItem]:
    return list_visible_workers(
        db=db,
        search=search,
        competency=competency,
        years_experience=years_experience,
        credential_status=credential_status,
    )


@router.get("/workers/{worker_id}", response_model=EmployerWorkerProfileRead)
def get_worker_profile(
    worker_id: int,
    _: User = Depends(require_roles(UserRole.employer)),
    db: Session = Depends(get_db),
) -> EmployerWorkerProfileRead:
    profile = get_visible_worker_profile(db, worker_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found or profile is private.",
        )
    return profile
