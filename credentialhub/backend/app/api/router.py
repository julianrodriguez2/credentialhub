from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.worker import router as worker_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(worker_router)
