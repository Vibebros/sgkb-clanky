import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sgkb.settings")

app = Celery("sgkb")

# Read settings from Django
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from installed apps
app.autodiscover_tasks()
