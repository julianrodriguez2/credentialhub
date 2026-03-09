from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.public_profile import PublicWorkerProfileRead
from app.services.public_profile_service import get_public_worker_profile_by_slug

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/workers/{public_slug}", response_model=PublicWorkerProfileRead)
def get_public_worker_profile(
    public_slug: str,
    db: Session = Depends(get_db),
) -> PublicWorkerProfileRead:
    profile = get_public_worker_profile_by_slug(db, public_slug)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public worker profile not found.",
        )
    return profile
