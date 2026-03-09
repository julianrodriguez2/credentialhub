from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Competency(Base):
    __tablename__ = "competencies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    worker_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competency_name: Mapped[str] = mapped_column(String(255), nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    certification_related: Mapped[str | None] = mapped_column(String(255), nullable=True)

    worker: Mapped["User"] = relationship(back_populates="competencies")
