import graphene
from .types import BankTransactionType
from finance.models import BankTransaction
from finance.utils import TransactionFilter
from django.utils.timezone import now
from django.db.models.functions import TruncMonth
from django.db.models import Sum
from datetime import timedelta


GERMAN_COUNTRY_MAP = {
    "Schweiz": "CH",
    "Deutschland": "DE",
    "Österreich": "AT",
    "Frankreich": "FR",
    "Italien": "IT",
    "Spanien": "ES",
    "Portugal": "PT",
    "Niederlande": "NL",
    "Belgien": "BE",
    "Luxemburg": "LU",
    "Grossbritannien": "GB",   # UK
    "Irland": "IE",
    "Dänemark": "DK",
    "Norwegen": "NO",
    "Schweden": "SE",
    "Kroatien": "HR",
    "Vereinigte Staaten": "US",
    "Kanada": "CA",
}


class MonthlyTotalType(graphene.ObjectType):
    month = graphene.Date()
    total = graphene.Decimal()
    percentage = graphene.Float()


class CountryTotalType(graphene.ObjectType):
    country = graphene.String()
    total = graphene.Decimal()
    country_code = graphene.String()


class Query(graphene.ObjectType):
    bank_transactions = graphene.List(
        BankTransactionType,
        start_date=graphene.Date(),
        end_date=graphene.Date(),
        payment_method=graphene.String(),
        min_amount=graphene.Decimal(),
        max_amount=graphene.Decimal(),
        country=graphene.String(),
        direction=graphene.Int(),
        produkt=graphene.String(),
        account_name=graphene.String(),
        customer_name=graphene.String(),
        buchungs_art_name=graphene.String(),
        text_short_creditor=graphene.String(),
        text_creditor=graphene.String(),
        text_debitor=graphene.String(),
        point_of_sale_and_location=graphene.String(),
        acquirer_country_name=graphene.String(),
        cred_iban=graphene.String(),
        cred_addr_text=graphene.String(),
        cred_ref_nr=graphene.String(),
        cred_info=graphene.String(),
    )


    monthly_totals = graphene.List(MonthlyTotalType)

    def resolve_monthly_totals(self, info):
        twelve_months_ago = now().date().replace(day=1) - timedelta(days=365)

        qs = (
            BankTransaction.objects
            .filter(val_date__gte=twelve_months_ago)
            .annotate(month=TruncMonth("val_date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        total_sum = sum(row["total"] or 0 for row in qs)

        results = []
        for row in qs:
            percentage = (float(row["total"]) / float(total_sum) * 100) if total_sum else 0.0
            results.append(
                MonthlyTotalType(
                    month=row["month"],
                    total=row["total"],
                    percentage=round(percentage, 2)
                )
            )
        return results


    def resolve_bank_transactions(
        root,
        info,
        start_date=None,
        end_date=None,
        payment_method=None,
        min_amount=None,
        max_amount=None,
        country=None,
        direction=None,
        produkt=None,
        account_name=None,
        customer_name=None,
        buchungs_art_name=None,
        text_short_creditor=None,
        text_creditor=None,
        text_debitor=None,
        point_of_sale_and_location=None,
        acquirer_country_name=None,
        cred_iban=None,
        cred_addr_text=None,
        cred_ref_nr=None,
        cred_info=None,
    ):
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
        return qs

    totals_by_country = graphene.List(CountryTotalType)

    def resolve_totals_by_country(self, info):
        qs = (
            BankTransaction.objects
            .values("acquirer_country_name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        results = []
        for row in qs:
            country = row["acquirer_country_name"]
            if not country:
                continue

            iso_code = GERMAN_COUNTRY_MAP.get(country)

            results.append(
                CountryTotalType(
                    country=country,
                    country_code=iso_code,
                    total=row["total"],
                )
            )
        return results