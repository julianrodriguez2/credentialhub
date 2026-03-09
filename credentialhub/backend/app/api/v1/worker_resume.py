from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.resume import GeneratedResumeRead, GeneratedResumeResponse
from app.services.resume_service import (
    ResumeGenerationError,
    generate_resume,
    get_latest_generated_resume,
)
from app.utils.pdf_generator import generate_resume_pdf

router = APIRouter(prefix="/api/worker/resume", tags=["worker-resume"])


@router.post("/generate", response_model=GeneratedResumeResponse)
def post_generate_resume(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> GeneratedResumeResponse:
    try:
        generated = generate_resume(db, current_worker.id)
    except ResumeGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return GeneratedResumeResponse(resume_text=generated.resume_text)


@router.get("/", response_model=GeneratedResumeRead)
def get_resume(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> GeneratedResumeRead:
    latest = get_latest_generated_resume(db, current_worker.id)
    if latest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No generated resume found.",
        )
    return latest


@router.get("/download")
def download_resume(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> Response:
    latest = get_latest_generated_resume(db, current_worker.id)
    if latest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No generated resume found.",
        )

    pdf_bytes = generate_resume_pdf(latest.resume_text)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=credentialhub_resume.pdf"},
    )
