import graphene
from graphene_django import DjangoObjectType
from finance.models import BankTransaction, Logo

class LogoType(DjangoObjectType):
    class Meta:
        model = Logo

class BankTransactionType(DjangoObjectType):
    class Meta:
        model = BankTransaction
    logo_url = graphene.String()

    def resolve_logo_url(self, info):
        return self.logo.url if self.logo else None