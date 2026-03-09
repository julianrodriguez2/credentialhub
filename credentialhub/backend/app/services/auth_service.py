from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.employer_profile import EmployerProfile
from app.models.user import User, UserRole
from app.models.worker_profile import WorkerProfile
from app.schemas.auth import RegisterRequest



def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))



def create_user(db: Session, payload: RegisterRequest) -> User:
    existing_user = get_user_by_email(db, payload.email)
    if existing_user is not None:
        raise ValueError("A user with this email already exists.")

    user = User(
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if user.role == UserRole.worker:
        db.add(
            WorkerProfile(
                user_id=user.id,
                full_name="",
                bio="",
                years_experience=0,
                profile_visibility=False,
            )
        )
    elif user.role == UserRole.employer:
        db.add(
            EmployerProfile(
                user_id=user.id,
                company_name="",
                industry="",
            )
        )

    db.commit()
    db.refresh(user)
    return user



def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user



def build_token_for_user(user: User) -> str:
    return create_access_token(
        subject=str(user.id),
        email=user.email,
        role=user.role.value,
    )
