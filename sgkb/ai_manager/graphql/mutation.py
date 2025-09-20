import graphene

import graphene
from graphene_django.types import DjangoObjectType
from ai_manager.models import Preference, PreferenceCategory
from .types import PreferenceType, PreferenceCategoryType


class CreatePreferenceCategory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)

    category = graphene.Field(PreferenceCategoryType)

    @classmethod
    def mutate(cls, root, info, name, description=None):
        category = PreferenceCategory.objects.create(name=name, description=description)
        return CreatePreferenceCategory(category=category)


class CreatePreference(graphene.Mutation):
    class Arguments:
        type = graphene.String(required=True)
        name = graphene.String(required=True)
        category_id = graphene.Int(required=False)
        score = graphene.Float(required=False)

    preference = graphene.Field(PreferenceType)

    @classmethod
    def mutate(cls, root, info, user_id, type, name, category_id=None, score=0.0):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.get(pk=user_id)

        category = None
        if category_id:
            category = PreferenceCategory.objects.get(pk=category_id)

        preference, _ = Preference.objects.update_or_create(
            user=user,
            type=type,
            name=name,
            defaults={"category": category, "score": score},
        )
        return CreatePreference(preference=preference)


class Mutation(graphene.ObjectType):
    create_preference_category = CreatePreferenceCategory.Field()
    create_preference = CreatePreference.Field()