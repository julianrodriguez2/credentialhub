from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.credential import Credential, CredentialType
from app.models.user import User, UserRole
from app.schemas.credential import CredentialRead, CredentialUploadPayload
from app.services.credential_service import (
    create_credential,
    delete_credential,
    get_credential_by_id,
    list_credentials,
)
from app.services.storage_service import DocumentStorageService, get_storage_service
from app.utils.credential_status import get_credential_status

router = APIRouter(prefix="/api/worker/credentials", tags=["worker-credentials"])


def serialize_credential(credential: Credential) -> CredentialRead:
    return CredentialRead(
        id=credential.id,
        worker_id=credential.worker_id,
        credential_name=credential.credential_name,
        credential_type=credential.credential_type,
        issuing_organization=credential.issuing_organization,
        issue_date=credential.issue_date,
        expiration_date=credential.expiration_date,
        document_url=credential.document_url,
        created_at=credential.created_at,
        status=get_credential_status(credential.expiration_date),
    )


@router.post("/upload", response_model=CredentialRead, status_code=status.HTTP_201_CREATED)
async def upload_credential(
    credential_name: str = Form(...),
    credential_type: CredentialType = Form(...),
    issuing_organization: str = Form(...),
    issue_date: date = Form(...),
    expiration_date: date | None = Form(default=None),
    file: UploadFile = File(...),
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
    storage_service: DocumentStorageService = Depends(get_storage_service),
) -> CredentialRead:
    payload = CredentialUploadPayload(
        credential_name=credential_name,
        credential_type=credential_type,
        issuing_organization=issuing_organization,
        issue_date=issue_date,
        expiration_date=expiration_date,
    )

    try:
        document_url = await storage_service.upload_file(
            file, key_prefix=f"workers/{current_worker.id}/credentials"
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload credential file.",
        )

    credential = create_credential(db, current_worker.id, payload, document_url)
    return serialize_credential(credential)


@router.get("/", response_model=list[CredentialRead])
def get_credentials(
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> list[CredentialRead]:
    credentials = list_credentials(db, current_worker.id)
    return [serialize_credential(credential) for credential in credentials]


@router.get("/{credential_id}", response_model=CredentialRead)
def get_credential(
    credential_id: UUID,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
) -> CredentialRead:
    credential = get_credential_by_id(db, current_worker.id, credential_id)
    if credential is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found."
        )
    return serialize_credential(credential)


@router.delete("/{credential_id}")
def remove_credential(
    credential_id: UUID,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
    storage_service: DocumentStorageService = Depends(get_storage_service),
) -> dict[str, bool]:
    credential = get_credential_by_id(db, current_worker.id, credential_id)
    if credential is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found."
        )

    try:
        storage_service.delete_file(credential.document_url)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to remove credential document from storage.",
        )

    delete_credential(db, credential)
    return {"success": True}
