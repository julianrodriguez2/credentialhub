from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.credential import Credential
from app.models.worker_profile import WorkerProfile
from app.utils.credential_status import get_credential_status

COMPLIANCE_INCOMPLETE = "incomplete"
COMPLIANCE_NON_COMPLIANT = "non_compliant"
COMPLIANCE_WARNING = "warning"
COMPLIANCE_COMPLIANT = "compliant"


@dataclass
class CredentialSummaryCounts:
    valid_count: int = 0
    expiring_count: int = 0
    expired_count: int = 0

    @property
    def total(self) -> int:
        return self.valid_count + self.expiring_count + self.expired_count


@dataclass
class WorkerComplianceSnapshot:
    compliance_status: str
    summary: CredentialSummaryCounts
    expiring_credentials: list[Credential]
    expired_credentials: list[Credential]
    last_compliance_check: datetime


def summarize_credentials(credentials: list[Credential]) -> CredentialSummaryCounts:
    summary = CredentialSummaryCounts()
    for credential in credentials:
        status = get_credential_status(credential.expiration_date)
        if status == "expired":
            summary.expired_count += 1
        elif status == "expiring":
            summary.expiring_count += 1
        else:
            summary.valid_count += 1
    return summary


def determine_worker_compliance_status(summary: CredentialSummaryCounts) -> str:
    if summary.total == 0:
        return COMPLIANCE_INCOMPLETE
    if summary.expired_count > 0:
        return COMPLIANCE_NON_COMPLIANT
    if summary.expiring_count > 0:
        return COMPLIANCE_WARNING
    return COMPLIANCE_COMPLIANT


def _get_or_create_profile(db: Session, worker_id: int) -> WorkerProfile:
    profile = db.scalar(
        select(WorkerProfile).where(WorkerProfile.user_id == worker_id)
    )
    if profile is None:
        profile = WorkerProfile(
            user_id=worker_id,
            full_name="",
            bio="",
            years_experience=0,
            profile_visibility=False,
            compliance_status=COMPLIANCE_INCOMPLETE,
        )
        db.add(profile)
        db.flush()
    return profile


def refresh_worker_compliance(db: Session, worker_id: int) -> WorkerProfile:
    profile = _get_or_create_profile(db, worker_id)

    credentials = list(
        db.scalars(select(Credential).where(Credential.worker_id == worker_id))
    )
    summary = summarize_credentials(credentials)

    profile.compliance_status = determine_worker_compliance_status(summary)
    profile.last_compliance_check = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


def get_worker_compliance_snapshot(
    db: Session, worker_id: int
) -> WorkerComplianceSnapshot:
    profile = refresh_worker_compliance(db, worker_id)
    credentials = list(
        db.scalars(
            select(Credential)
            .where(Credential.worker_id == worker_id)
            .order_by(Credential.created_at.desc())
        )
    )

    summary = summarize_credentials(credentials)
    expiring_credentials = [
        credential
        for credential in credentials
        if get_credential_status(credential.expiration_date) == "expiring"
    ]
    expired_credentials = [
        credential
        for credential in credentials
        if get_credential_status(credential.expiration_date) == "expired"
    ]

    return WorkerComplianceSnapshot(
        compliance_status=profile.compliance_status,
        summary=summary,
        expiring_credentials=expiring_credentials,
        expired_credentials=expired_credentials,
        last_compliance_check=profile.last_compliance_check
        or datetime.now(timezone.utc),
    )
