'''
The root GraphQL schema.
'''

__all__ = (
    'SCHEMA',
)

from graphene import Schema

from .mutation import Mutation
from .query import Query

schema = Schema(
    query=Query,
    # mutation=Mutation,
)
