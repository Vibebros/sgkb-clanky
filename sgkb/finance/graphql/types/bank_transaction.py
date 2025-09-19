import graphene
from graphene_django import DjangoObjectType
from finance.models import BankTransaction

class BankTransactionType(DjangoObjectType):
    class Meta:
        model = BankTransaction