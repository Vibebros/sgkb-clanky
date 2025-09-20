import asyncio
from collections import defaultdict
from typing import Any
from agents import function_tool, RunContextWrapper
from finance.models import BankTransaction
from finance.utils import TransactionFilter
from asgiref.sync import sync_to_async


@function_tool
async def get_transactions(
    ctx: RunContextWrapper[Any],
    start_date: str | None = None,
    end_date: str | None = None,
    payment_method: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    country: str | None = None,
    direction: str | None = None,
    produkt: str | None = None,
    account_name: str | None = None,
    customer_name: str | None = None,
    buchungs_art_name: str | None = None,
    text_short_creditor: str | None = None,
    text_creditor: str | None = None,
    text_debitor: str | None = None,
    point_of_sale_and_location: str | None = None,
    acquirer_country_name: str | None = None,
    cred_iban: str | None = None,
    cred_addr_text: str | None = None,
    cred_ref_nr: str | None = None,
    cred_info: str | None = None,
) -> list[dict]:
    """Fetch filtered bank transactions."""

    def run_query():
        qs = BankTransaction.objects.all()
        qs = TransactionFilter.apply(
            qs,
            start_date=start_date,
            end_date=end_date,
            payment_method=payment_method,
            min_amount=min_amount,
            max_amount=max_amount,
            country=country,
            direction=direction,
            produkt=produkt,
            account_name=account_name,
            customer_name=customer_name,
            buchungs_art_name=buchungs_art_name,
            text_short_creditor=text_short_creditor,
            text_creditor=text_creditor,
            text_debitor=text_debitor,
            point_of_sale_and_location=point_of_sale_and_location,
            acquirer_country_name=acquirer_country_name,
            cred_iban=cred_iban,
            cred_addr_text=cred_addr_text,
            cred_ref_nr=cred_ref_nr,
            cred_info=cred_info,
        )

        return list(
            qs.values(
                "id",
                "val_date",
                "amount",
                "direction",
                "customer_name",
                "account_name",
                "trx_type_name",
                "acquirer_country_name",
            )
        )

    # Run Django ORM safely in a thread
    return await asyncio.to_thread(run_query)

@function_tool
async def count_all_transactions() -> str:
    """Return how many transactions exist in the database."""
    print('whut')
    count = await sync_to_async(BankTransaction.objects.count)()
    return str(count)



@function_tool
async def detect_recurring_payments(
    ctx: RunContextWrapper[Any],
    min_occurrences: int = 3,
    min_interval_days: int = 25,
    max_interval_days: int = 35,
    amount_tolerance: float = 0.2,
) -> list[dict]:
    """Detect recurring outgoing payments (subscriptions, rent, utilities).

    Args:
        min_occurrences: Minimum times a payment must occur to be considered recurring.
        min_interval_days: Minimum days between payments (default ~monthly).
        max_interval_days: Maximum days between payments (default ~monthly).
        amount_tolerance: Allowed relative variation in amounts (e.g. 0.2 = ±20%).
    """

    def run_query():
        qs = (
            BankTransaction.objects.filter(direction=2)  # only outgoing
            .values("text_creditor", "amount", "val_date")
        )

        groups = defaultdict(list)
        for tx in qs:
            creditor = tx["text_creditor"] or "Unknown"
            groups[creditor].append(tx)

        recurring = []
        for creditor, txs in groups.items():
            txs = sorted(txs, key=lambda t: t["val_date"])
            if len(txs) < min_occurrences:
                continue

            # Check date intervals
            intervals = [
                (txs[i + 1]["val_date"] - txs[i]["val_date"]).days
                for i in range(len(txs) - 1)
            ]
            if not all(min_interval_days <= d <= max_interval_days for d in intervals):
                continue

            # Check amount consistency with tolerance
            base_amount = txs[0]["amount"]
            if not all(
                abs(tx["amount"] - base_amount) <= base_amount * amount_tolerance
                for tx in txs
            ):
                continue

            recurring.append(
                {
                    "creditor": creditor,
                    "base_amount": base_amount,
                    "occurrences": len(txs),
                    "last_payment": txs[-1]["val_date"],
                }
            )

        return recurring

    return await asyncio.to_thread(run_query)