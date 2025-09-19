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
    )

    def resolve_bank_transactions(root, info, start_date=None, end_date=None, payment_method=None):
        qs = BankTransaction.objects.all()
        TransactionFilter.apply(
            qs,
            start_date,
            end_date,
            payment_method,
        )
        return qs