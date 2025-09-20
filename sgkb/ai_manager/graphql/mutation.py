import graphene


class Mutation(graphene.ObjectType):
    create_appointment = CreateAppointment.Field()
