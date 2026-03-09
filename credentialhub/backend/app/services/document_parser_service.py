import json
from datetime import date
from io import BytesIO
from pathlib import Path
from urllib import error, request

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.parsed_credential_audit import ParsedCredentialAudit
from app.models.credential import CredentialType
from app.schemas.credential import ParsedCredentialResult
from app.services.storage_service import DocumentStorageService

MAX_AI_INPUT_CHARS = 12000


class DocumentParserError(Exception):
    pass


def _safe_parse_date(value: object) -> date | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        return None


def _safe_parse_credential_type(value: object) -> CredentialType | None:
    if not isinstance(value, str):
        return None
    lowered = value.strip().lower()
    if lowered not in {"license", "certificate", "training"}:
        return None
    return CredentialType(lowered)


def _safe_parse_confidence(value: object) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None

    if parsed < 0:
        return 0.0
    if parsed > 1:
        return 1.0
    return parsed


def _extract_text_from_image(content: bytes) -> str:
    try:
        from PIL import Image
        import pytesseract
    except Exception as exc:  # pragma: no cover
        raise DocumentParserError(
            "OCR dependencies are unavailable. Install pillow and pytesseract."
        ) from exc

    with Image.open(BytesIO(content)) as image:
        return pytesseract.image_to_string(image).strip()


def _extract_text_from_pdf_ocr(content: bytes) -> str:
    try:
        import pypdfium2
        import pytesseract
    except Exception as exc:  # pragma: no cover
        raise DocumentParserError(
            "PDF OCR dependencies are unavailable. Install pypdfium2 and pytesseract."
        ) from exc

    text_parts: list[str] = []
    pdf_doc = pypdfium2.PdfDocument(content)
    page_count = len(pdf_doc)
    for index in range(min(page_count, 20)):
        page = pdf_doc[index]
        bitmap = page.render(scale=2.0)
        pil_image = bitmap.to_pil()
        text_parts.append(pytesseract.image_to_string(pil_image).strip())
        page.close()
    pdf_doc.close()
    return "\n".join(part for part in text_parts if part).strip()


def _extract_text_from_pdf(content: bytes) -> str:
    text_parts: list[str] = []
    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(content))
        for page in reader.pages:
            extracted = page.extract_text() or ""
            if extracted.strip():
                text_parts.append(extracted.strip())
    except Exception:
        pass

    text = "\n".join(text_parts).strip()
    if len(text) >= 120:
        return text

    ocr_text = _extract_text_from_pdf_ocr(content)
    merged = "\n".join(part for part in [text, ocr_text] if part).strip()
    return merged


def _extract_document_text(content: bytes, content_type: str | None, file_url: str) -> str:
    suffix = Path(file_url).suffix.lower()
    lowered_content_type = (content_type or "").lower()

    if suffix == ".pdf" or lowered_content_type == "application/pdf":
        return _extract_text_from_pdf(content)

    if suffix in {".png", ".jpg", ".jpeg", ".webp"} or lowered_content_type.startswith(
        "image/"
    ):
        return _extract_text_from_image(content)

    try:
        decoded = content.decode("utf-8")
        return decoded.strip()
    except Exception:
        raise DocumentParserError("Unsupported file format for parsing.")


def _build_parser_prompt(extracted_text: str) -> str:
    trimmed = extracted_text[:MAX_AI_INPUT_CHARS]
    return (
        "You extract structured credential data from workforce compliance documents.\n\n"
        "Given the following document text, return JSON with:\n"
        "credential_name\n"
        "credential_type\n"
        "issuing_organization\n"
        "issue_date\n"
        "expiration_date\n"
        "confidence_score\n\n"
        "Only use values supported by the document.\n"
        "If a field is missing, return null.\n"
        "Use ISO date format for dates.\n"
        "Allowed credential_type values: license, certificate, training.\n"
        "Return JSON only.\n\n"
        f"Document text:\n{trimmed}"
    )


def _parse_with_openai(extracted_text: str) -> ParsedCredentialResult:
    if not settings.OPENAI_API_KEY:
        raise DocumentParserError("OPENAI_API_KEY is not configured.")

    endpoint = f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        "model": settings.OPENAI_MODEL,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "You are a strict JSON credential data extractor.",
            },
            {"role": "user", "content": _build_parser_prompt(extracted_text)},
        ],
    }

    req = request.Request(
        endpoint,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload).encode("utf-8"),
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            raw_response = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise DocumentParserError(
            f"OpenAI parsing failed ({exc.code}): {detail or exc.reason}"
        )
    except error.URLError:
        raise DocumentParserError("Unable to reach OpenAI parsing service.")

    try:
        decoded = json.loads(raw_response)
        message_content = decoded["choices"][0]["message"]["content"]
        parsed_json = json.loads(message_content)
    except Exception as exc:
        raise DocumentParserError("OpenAI returned an invalid parsing payload.") from exc

    return ParsedCredentialResult(
        credential_name=parsed_json.get("credential_name")
        if isinstance(parsed_json.get("credential_name"), str)
        else None,
        credential_type=_safe_parse_credential_type(parsed_json.get("credential_type")),
        issuing_organization=parsed_json.get("issuing_organization")
        if isinstance(parsed_json.get("issuing_organization"), str)
        else None,
        issue_date=_safe_parse_date(parsed_json.get("issue_date")),
        expiration_date=_safe_parse_date(parsed_json.get("expiration_date")),
        confidence_score=_safe_parse_confidence(parsed_json.get("confidence_score")),
        raw_extracted_text=extracted_text or None,
    )


def empty_parse_result(raw_extracted_text: str | None = None) -> ParsedCredentialResult:
    return ParsedCredentialResult(
        credential_name=None,
        credential_type=None,
        issuing_organization=None,
        issue_date=None,
        expiration_date=None,
        confidence_score=0.0,
        raw_extracted_text=raw_extracted_text,
    )


def parse_credential_document(
    file_url: str,
    storage_service: DocumentStorageService,
) -> ParsedCredentialResult:
    content, content_type = storage_service.download_file(file_url)
    extracted_text = _extract_document_text(content, content_type, file_url)
    if not extracted_text:
        return empty_parse_result(raw_extracted_text=None)
    return _parse_with_openai(extracted_text)


def save_parse_audit(
    db: Session,
    worker_id: int,
    file_url: str,
    parsed_result: ParsedCredentialResult,
) -> ParsedCredentialAudit:
    audit = ParsedCredentialAudit(
        worker_id=worker_id,
        file_url=file_url,
        raw_extracted_text=parsed_result.raw_extracted_text,
        parsed_result_json=parsed_result.model_dump(mode="json"),
        confidence_score=parsed_result.confidence_score,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
