from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.credential import Credential, CredentialType
from app.models.user import User, UserRole
from app.schemas.credential import (
    CredentialConfirmPayload,
    CredentialParseResponse,
    CredentialRead,
    CredentialReparsePayload,
    CredentialUploadPayload,
)
from app.services.document_parser_service import (
    DocumentParserError,
    empty_parse_result,
    parse_credential_document,
    save_parse_audit,
)
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


def ensure_worker_file_access(
    storage_service: DocumentStorageService, file_url: str, worker_id: int
) -> None:
    key = storage_service.extract_object_key(file_url)
    expected_prefix = f"workers/{worker_id}/credentials/"
    if not key.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this document.",
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


@router.post("/parse", response_model=CredentialParseResponse)
async def parse_credential(
    file: UploadFile = File(...),
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
    storage_service: DocumentStorageService = Depends(get_storage_service),
) -> CredentialParseResponse:
    try:
        file_url = await storage_service.upload_file(
            file, key_prefix=f"workers/{current_worker.id}/credentials"
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload credential file.",
        )

    parse_warning: str | None = None
    try:
        parsed_fields = parse_credential_document(file_url, storage_service)
    except DocumentParserError as exc:
        parse_warning = str(exc)
        parsed_fields = empty_parse_result()
    except Exception:
        parse_warning = "Document parsing failed. Please review fields manually."
        parsed_fields = empty_parse_result()

    save_parse_audit(db, current_worker.id, file_url, parsed_fields)
    return CredentialParseResponse(
        file_url=file_url,
        parsed_fields=parsed_fields,
        parse_warning=parse_warning,
    )


@router.post("/reparse", response_model=CredentialParseResponse)
def reparse_credential(
    payload: CredentialReparsePayload,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
    storage_service: DocumentStorageService = Depends(get_storage_service),
) -> CredentialParseResponse:
    ensure_worker_file_access(storage_service, payload.file_url, current_worker.id)

    parse_warning: str | None = None
    try:
        parsed_fields = parse_credential_document(payload.file_url, storage_service)
    except DocumentParserError as exc:
        parse_warning = str(exc)
        parsed_fields = empty_parse_result()
    except Exception:
        parse_warning = "Document parsing failed. Please review fields manually."
        parsed_fields = empty_parse_result()

    save_parse_audit(db, current_worker.id, payload.file_url, parsed_fields)
    return CredentialParseResponse(
        file_url=payload.file_url,
        parsed_fields=parsed_fields,
        parse_warning=parse_warning,
    )


@router.post("/confirm", response_model=CredentialRead, status_code=status.HTTP_201_CREATED)
def confirm_credential(
    payload: CredentialConfirmPayload,
    current_worker: User = Depends(require_roles(UserRole.worker)),
    db: Session = Depends(get_db),
    storage_service: DocumentStorageService = Depends(get_storage_service),
) -> CredentialRead:
    ensure_worker_file_access(storage_service, payload.file_url, current_worker.id)

    credential_payload = CredentialUploadPayload(
        credential_name=payload.credential_name,
        credential_type=payload.credential_type,
        issuing_organization=payload.issuing_organization,
        issue_date=payload.issue_date,
        expiration_date=payload.expiration_date,
    )
    credential = create_credential(
        db=db,
        worker_id=current_worker.id,
        payload=credential_payload,
        document_url=payload.file_url,
    )
    return serialize_credential(credential)


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
