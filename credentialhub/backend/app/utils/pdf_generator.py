from io import BytesIO

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


def _wrap_text(text: str, max_chars: int = 100) -> list[str]:
    wrapped: list[str] = []
    for paragraph in text.splitlines():
        paragraph = paragraph.rstrip()
        if not paragraph:
            wrapped.append("")
            continue

        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if len(candidate) <= max_chars:
                current = candidate
            else:
                if current:
                    wrapped.append(current)
                current = word
        if current:
            wrapped.append(current)
    return wrapped


def generate_resume_pdf(resume_text: str) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=LETTER)
    page_width, page_height = LETTER

    left_margin = 0.75 * inch
    right_margin = 0.75 * inch
    top_margin = 0.75 * inch
    bottom_margin = 0.75 * inch
    max_width = page_width - left_margin - right_margin

    text_object = pdf.beginText()
    text_object.setTextOrigin(left_margin, page_height - top_margin)
    text_object.setLeading(14)
    text_object.setFont("Helvetica", 11)

    # Approximation for wrapping with Helvetica 11.
    approx_max_chars = max(60, int(max_width / 6.2))
    lines = _wrap_text(resume_text, max_chars=approx_max_chars)

    current_y = page_height - top_margin
    for line in lines:
        if current_y <= bottom_margin:
            pdf.drawText(text_object)
            pdf.showPage()
            text_object = pdf.beginText()
            text_object.setTextOrigin(left_margin, page_height - top_margin)
            text_object.setLeading(14)
            text_object.setFont("Helvetica", 11)
            current_y = page_height - top_margin

        text_object.textLine(line)
        current_y -= 14

    pdf.drawText(text_object)
    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()
