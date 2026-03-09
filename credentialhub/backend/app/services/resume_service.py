import json
from datetime import date
from urllib import error, request

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.generated_resume import GeneratedResume
from app.models.user import User, UserRole
from app.models.worker_profile import WorkerProfile
from app.utils.credential_status import get_credential_status


class ResumeGenerationError(Exception):
    pass


def get_latest_generated_resume(db: Session, worker_id: int) -> GeneratedResume | None:
    return db.scalar(
        select(GeneratedResume)
        .where(GeneratedResume.worker_id == worker_id)
        .order_by(GeneratedResume.created_at.desc())
    )


def _fmt_date(value: date | None) -> str:
    if value is None:
        return "N/A"
    return value.isoformat()


def _build_prompt(worker: User, profile: WorkerProfile) -> str:
    experiences = sorted(
        worker.work_experiences,
        key=lambda item: item.start_date,
        reverse=True,
    )
    competencies = sorted(
        worker.competencies,
        key=lambda item: (-item.years_experience, item.competency_name.lower()),
    )
    credentials = sorted(
        worker.credentials,
        key=lambda item: item.created_at,
        reverse=True,
    )
    references = sorted(
        worker.references, key=lambda item: item.reference_name.lower()
    )

    profile_name = profile.full_name.strip() or worker.email
    summary = profile.bio.strip() or "No summary provided."

    work_experience_lines = [
        (
            f"- {item.role_title} at {item.company_name} "
            f"({_fmt_date(item.start_date)} to {_fmt_date(item.end_date)}): "
            f"{item.description or 'No description provided.'} "
            f"Equipment: {item.equipment_used or 'N/A'}"
        )
        for item in experiences
    ] or ["- No work experience provided."]

    competency_lines = [
        (
            f"- {item.competency_name} "
            f"({item.years_experience} years)"
            + (
                f", certification: {item.certification_related}"
                if item.certification_related
                else ""
            )
        )
        for item in competencies
    ] or ["- No competencies provided."]

    credential_lines = [
        (
            f"- {item.credential_name} ({item.credential_type.value}) "
            f"issued by {item.issuing_organization}, "
            f"issue date: {_fmt_date(item.issue_date)}, "
            f"expiration: {_fmt_date(item.expiration_date)}, "
            f"status: {get_credential_status(item.expiration_date)}"
        )
        for item in credentials
    ] or ["- No certifications or licenses provided."]

    reference_lines = [
        (
            f"- {item.reference_name}, {item.position} at {item.company}, "
            f"relationship: {item.relationship}, "
            f"email: {item.email}, phone: {item.phone}, "
            f"verified: {'yes' if item.verified else 'no'}"
        )
        for item in references
    ] or ["- No references provided."]

    return f"""You are a professional resume writer.

Generate a concise, professional resume for a skilled worker using the following information.

Worker Profile:
Name: {profile_name}
Years Experience: {profile.years_experience}
Summary/Bio: {summary}

Work Experience:
{chr(10).join(work_experience_lines)}

Skills / Competencies:
{chr(10).join(competency_lines)}

Certifications / Licenses:
{chr(10).join(credential_lines)}

References:
{chr(10).join(reference_lines)}

Format the resume with sections:

Professional Summary
Skills
Work Experience
Certifications
References

Use clear bullet points and professional tone.
"""


def _generate_resume_text(prompt: str) -> str:
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise ResumeGenerationError("OPENAI_API_KEY is not configured.")

    base_url = settings.OPENAI_BASE_URL.rstrip("/")
    endpoint = f"{base_url}/chat/completions"
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You write high-quality professional resumes for skilled workers.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
    }
    body = json.dumps(payload).encode("utf-8")

    req = request.Request(
        endpoint,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        data=body,
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            content = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ResumeGenerationError(
            f"OpenAI API error ({exc.code}): {detail or exc.reason}"
        )
    except error.URLError:
        raise ResumeGenerationError("Unable to reach OpenAI API.")

    try:
        parsed = json.loads(content)
        choices = parsed.get("choices", [])
        if not choices:
            raise KeyError("choices")
        message = choices[0].get("message", {})
        text = message.get("content", "")
        if not isinstance(text, str) or not text.strip():
            raise KeyError("content")
        return text.strip()
    except (KeyError, ValueError, TypeError):
        raise ResumeGenerationError("Unexpected OpenAI response format.")


def generate_resume(db: Session, worker_id: int) -> GeneratedResume:
    worker = db.scalar(
        select(User)
        .where(User.id == worker_id, User.role == UserRole.worker)
        .options(
            selectinload(User.worker_profile),
            selectinload(User.work_experiences),
            selectinload(User.competencies),
            selectinload(User.credentials),
            selectinload(User.references),
        )
    )
    if worker is None:
        raise ResumeGenerationError("Worker not found.")

    profile = worker.worker_profile
    if profile is None:
        profile = WorkerProfile(
            user_id=worker.id,
            full_name="",
            bio="",
            years_experience=0,
            profile_visibility=False,
            compliance_status="incomplete",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    prompt = _build_prompt(worker, profile)
    resume_text = _generate_resume_text(prompt)

    generated_resume = GeneratedResume(worker_id=worker_id, resume_text=resume_text)
    db.add(generated_resume)
    db.commit()
    db.refresh(generated_resume)
    return generated_resume
