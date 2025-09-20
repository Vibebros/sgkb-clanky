from celery import shared_task
import time

from finance.models import BankTransaction


@shared_task
def create_recommendation(x, y):
    time.sleep(5)  # simulate heavy work
    return x + y