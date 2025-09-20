import graphene
from graphene_django import DjangoObjectType
from ai_manager.models import Preference

class PreferenceType(DjangoObjectType):
    class Meta:
        model = Preference

