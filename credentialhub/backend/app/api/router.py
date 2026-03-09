from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.employer import router as employer_router
from app.api.v1.public import router as public_router
from app.api.v1.reference_verification import router as reference_verification_router
from app.api.v1.worker_credentials import router as credential_router
from app.api.v1.worker import router as worker_router
from app.api.v1.worker_resume import router as worker_resume_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(employer_router)
api_router.include_router(public_router)
api_router.include_router(reference_verification_router)
api_router.include_router(worker_router)
api_router.include_router(credential_router)
api_router.include_router(worker_resume_router)
