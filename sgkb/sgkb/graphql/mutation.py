import graphene


from ai_manager.graphql import Mutation as AIMutation


class Mutation(AIMutation, graphene.ObjectType):
    pass
