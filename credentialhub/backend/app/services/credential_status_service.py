from datetime import date


def get_credential_status(expiration_date: date | None) -> str:
    if expiration_date is None:
        return "valid"

    today = date.today()
    if expiration_date < today:
        return "expired"

    days_until_expiration = (expiration_date - today).days
    if days_until_expiration <= 60:
        return "expiring"

    return "valid"
