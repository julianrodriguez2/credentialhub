from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.credential import Credential
from app.schemas.credential import CredentialUploadPayload


def create_credential(
    db: Session,
    worker_id: int,
    payload: CredentialUploadPayload,
    document_url: str,
) -> Credential:
    credential = Credential(
        worker_id=worker_id,
        document_url=document_url,
        **payload.model_dump(),
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)
    return credential


def list_credentials(db: Session, worker_id: int) -> list[Credential]:
    return list(
        db.scalars(
            select(Credential)
            .where(Credential.worker_id == worker_id)
            .order_by(Credential.created_at.desc())
        )
    )


def get_credential_by_id(
    db: Session, worker_id: int, credential_id: UUID
) -> Credential | None:
    return db.scalar(
        select(Credential).where(
            Credential.id == credential_id, Credential.worker_id == worker_id
        )
    )


def delete_credential(db: Session, credential: Credential) -> None:
    db.delete(credential)
    db.commit()
