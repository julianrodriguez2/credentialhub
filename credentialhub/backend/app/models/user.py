import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.credential import Credential
    from app.models.competency import Competency
    from app.models.employer_profile import EmployerProfile
    from app.models.generated_resume import GeneratedResume
    from app.models.parsed_credential_audit import ParsedCredentialAudit
    from app.models.reference import Reference
    from app.models.work_experience import WorkExperience
    from app.models.worker_profile import WorkerProfile


class UserRole(str, enum.Enum):
    worker = "worker"
    employer = "employer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.worker,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    worker_profile: Mapped["WorkerProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    employer_profile: Mapped["EmployerProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    work_experiences: Mapped[list["WorkExperience"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )
    competencies: Mapped[list["Competency"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )
    references: Mapped[list["Reference"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )
    credentials: Mapped[list["Credential"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )
    generated_resumes: Mapped[list["GeneratedResume"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )
    parsed_credential_audits: Mapped[list["ParsedCredentialAudit"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )
