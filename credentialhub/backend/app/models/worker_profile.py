from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    bio: Mapped[str] = mapped_column(Text, default="", nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    profile_visibility: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    public_slug: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    compliance_status: Mapped[str] = mapped_column(
        String(32), default="incomplete", nullable=False
    )
    last_compliance_check: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="worker_profile")
