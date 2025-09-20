import requests
from django.conf import settings

from finance.models import BankTransaction


def search_logo(query: str):
    """
    Search for a company logo using logo.dev
    If not found, progressively shorten the query.
    """
    def _api_search(q: str):
        url = "https://api.logo.dev/search"
        headers = {"Authorization": f"Bearer {settings.LOGO_API_KEY}"}
        params = {"q": q}
        resp = requests.get(url, headers=headers, params=params, timeout=10)

        if resp.status_code != 200:
            return None

        results = resp.json()
        if not results:
            return None

        return results[0]["logo_url"]

    # Try full query first
    logo_url = _api_search(query)
    if logo_url:
        return logo_url

    # If not found, progressively shorten
    parts = query.split()
    while len(parts) > 1:
        parts = parts[:-1]  # drop last token
        shorter_query = " ".join(parts)
        logo_url = _api_search(shorter_query)
        if logo_url:
            print(f"⚠️ Fallback: Found logo for shortened '{shorter_query}'")
            return logo_url

    return None


def extract_company_name(tx: BankTransaction) -> str | None:
    """
    Extract company name from transaction fields.
    Strategy: TEXT_DEBITOR first, fallback to TEXT_CREDITOR.
    Take only before first comma.
    """
    raw = (tx.text_debitor or tx.text_creditor or "").strip()
    if not raw:
        return None
    return raw.split(",")[0].strip()