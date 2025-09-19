import graphene
from .types import BankTransactionType



class Query(graphene.ObjectType):
    bank_transactions = graphene.List(BankTransactionType)
