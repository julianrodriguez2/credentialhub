import logging
import secrets
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.reference import Reference

logger = logging.getLogger(__name__)


def build_verification_link(token: str) -> str:
    base = settings.BACKEND_PUBLIC_URL.rstrip("/")
    return f"{base}/api/reference/verify?token={quote(token)}"


def send_reference_verification_email(reference: Reference, verification_link: str) -> None:
    subject = "CredentialHub reference verification request"
    body = (
        f"Hello {reference.reference_name},\n\n"
        "A worker on CredentialHub asked you to verify their professional reference.\n"
        f"Please confirm by opening this link:\n{verification_link}\n\n"
        "If you did not expect this, you can ignore this email."
    )

    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.info(
            "Reference verification email (mock send) to=%s subject=%s link=%s",
            reference.email,
            subject,
            verification_link,
        )
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = reference.email
    message.set_content(body)

    if settings.SMTP_USE_TLS:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)


def send_reference_verification_request(
    db: Session, worker_id: int, reference_id: int
) -> Reference | None:
    reference = db.scalar(
        select(Reference).where(
            Reference.id == reference_id,
            Reference.worker_id == worker_id,
        )
    )
    if reference is None:
        return None

    token = secrets.token_urlsafe(32)
    sent_at = datetime.now(timezone.utc)

    reference.verified = False
    reference.verification_token = token
    reference.verification_sent_at = sent_at
    reference.verification_confirmed_at = None
    db.commit()
    db.refresh(reference)

    send_reference_verification_email(reference, build_verification_link(token))
    return reference


def verify_reference_by_token(db: Session, token: str) -> Reference | None:
    reference = db.scalar(
        select(Reference).where(Reference.verification_token == token)
    )
    if reference is None:
        return None

    confirmed_at = datetime.now(timezone.utc)
    reference.verified = True
    reference.verification_confirmed_at = confirmed_at
    reference.verification_token = None
    db.commit()
    db.refresh(reference)
    return reference
