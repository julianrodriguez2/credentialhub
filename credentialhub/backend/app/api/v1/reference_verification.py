from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.reference import ReferenceVerificationConfirmResponse
from app.services.reference_verification_service import verify_reference_by_token

router = APIRouter(prefix="/api/reference", tags=["reference"])


@router.get("/verify", response_model=ReferenceVerificationConfirmResponse)
def verify_reference(
    token: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> ReferenceVerificationConfirmResponse:
    reference = verify_reference_by_token(db, token)
    if reference is None or reference.verification_confirmed_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification token is invalid or expired.",
        )

    return ReferenceVerificationConfirmResponse(
        message="Reference verification completed successfully.",
        verified=True,
        verification_confirmed_at=reference.verification_confirmed_at,
    )
