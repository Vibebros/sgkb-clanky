from django.db import models
from django.conf import settings


class PreferenceCategory(models.Model):
    """
    High-level category (Food, Travel, Events, Shopping).
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Preference(models.Model):
    """
    Unified user preference model for merchants, events, categories, etc.
    Differentiated by 'type'.
    """
    PREFERENCE_TYPES = [
        ("merchant", "Merchant"),
        ("event", "Event"),
        ("category", "Category"),
        ("other", "Other"),
    ]

    type = models.CharField(max_length=20, choices=PREFERENCE_TYPES)
    name = models.CharField(max_length=255)  # e.g., "Coop", "Coldplay Concert 2025"
    category = models.ForeignKey(
        PreferenceCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="preferences"
    )
    score = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} → [{self.type}] {self.name} ({self.score:.2f})"
