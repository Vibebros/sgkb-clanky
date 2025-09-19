import graphene

from finance.graphql import Query as FinanceQuery

class Query(FinanceQuery, graphene.ObjectType):
    hello = graphene.String(default_value="Hi!")
