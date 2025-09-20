import graphene
from graphene_django import DjangoObjectType
from ai_manager.models import PreferenceCategory

class PreferenceCategoryType(DjangoObjectType):
    class Meta:
        model = PreferenceCategory

