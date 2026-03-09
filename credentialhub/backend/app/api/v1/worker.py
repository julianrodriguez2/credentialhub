from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.competency import CompetencyCreate, CompetencyRead
from app.schemas.reference import ReferenceCreate, ReferenceRead
from app.schemas.work_experience import (
    WorkExperienceCreate,
    WorkExperienceRead,
    WorkExperienceUpdate,
)
from app.schemas.worker_profile import WorkerProfileRead, WorkerProfileUpdate
from app.services.worker_service import (
    add_competency,
    add_reference,
    add_work_experience,
    delete_competency,
    delete_reference,
    delete_work_experience,
    get_or_create_worker_profile,
    list_competencies,
    list_references,
    list_work_experiences,
    update_work_experience,
    update_worker_profile,
)

router = APIRouter(prefix="/api/worker", tags=["worker"])


@router.get("/profile", response_model=WorkerProfileRead)
def get_profile(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> WorkerProfileRead:
    return get_or_create_worker_profile(db, current_worker.id)


@router.put("/profile", response_model=WorkerProfileRead)
def put_profile(
    payload: WorkerProfileUpdate,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> WorkerProfileRead:
    return update_worker_profile(db, current_worker.id, payload)


@router.post(
    "/experience",
    response_model=WorkExperienceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_experience(
    payload: WorkExperienceCreate,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> WorkExperienceRead:
    return add_work_experience(db, current_worker.id, payload)


@router.get("/experience", response_model=list[WorkExperienceRead])
def get_experiences(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> list[WorkExperienceRead]:
    return list_work_experiences(db, current_worker.id)


@router.put("/experience", response_model=WorkExperienceRead)
def put_experience(
    payload: WorkExperienceUpdate,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> WorkExperienceRead:
    experience = update_work_experience(db, current_worker.id, payload)
    if experience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")
    return experience


@router.delete("/experience")
def remove_experience(
    experience_id: UUID = Query(..., alias="id"),
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = delete_work_experience(db, current_worker.id, experience_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")
    return {"success": True}


@router.post(
    "/competencies",
    response_model=CompetencyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_competency(
    payload: CompetencyCreate,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> CompetencyRead:
    return add_competency(db, current_worker.id, payload)


@router.get("/competencies", response_model=list[CompetencyRead])
def get_competencies(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> list[CompetencyRead]:
    return list_competencies(db, current_worker.id)


@router.delete("/competencies")
def remove_competency(
    competency_id: int = Query(..., alias="id"),
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = delete_competency(db, current_worker.id, competency_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found.")
    return {"success": True}


@router.post(
    "/references",
    response_model=ReferenceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_reference(
    payload: ReferenceCreate,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> ReferenceRead:
    return add_reference(db, current_worker.id, payload)


@router.get("/references", response_model=list[ReferenceRead])
def get_references(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> list[ReferenceRead]:
    return list_references(db, current_worker.id)


@router.delete("/references")
def remove_reference(
    reference_id: int = Query(..., alias="id"),
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = delete_reference(db, current_worker.id, reference_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found.")
    return {"success": True}
