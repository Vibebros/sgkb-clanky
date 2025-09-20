import graphene
from .types import BankTransactionType
from finance.models import BankTransaction
from finance.utils import TransactionFilter

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