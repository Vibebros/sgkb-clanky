from celery import shared_task
import time

from .utils.logo import search_logo, extract_company_name
from finance.models import BankTransaction, Logo

@shared_task
def add(x, y):
    time.sleep(5)  # simulate heavy work
    return x + y


@shared_task
def enrich_transaction_logos():
    """
    Loop over all BankTransactions and enrich them with a Logo.
    """
    # Preload logos into a cache dict
    logo_cache = {logo.name.lower(): logo for logo in Logo.objects.all()}

    count_new, count_linked = 0, 0

    for tx in BankTransaction.objects.all()[:10]:
        if tx.logo:  # already linked
            continue

        company = extract_company_name(tx)
        if not company:
            continue

        key = company.lower()

        # Already in cache?
        logo = logo_cache.get(key)
        if logo:
            tx.logo = logo
            tx.save(update_fields=["logo"])
            count_linked += 1
            continue

        # Fetch via API
        logo_url = search_logo(company)
        print(logo_url)
        if logo_url:
            logo = Logo.objects.create(name=company, url=logo_url)
            logo_cache[key] = logo
            tx.logo = logo
            tx.save(update_fields=["logo"])
            count_new += 1

            print(f"✅ Added logo for {company} -> {logo_url}")
        else:
            print(f"⚠️ No logo found for {company}")

    print(f"Done. Linked {count_linked}, created {count_new} new logos.")