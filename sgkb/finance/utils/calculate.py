import statistics
from collections import Counter
from datetime import datetime

class TransactionCalculator:
    @staticmethod
    def sum(queryset, field="amount"):
        return sum(getattr(tx, field) for tx in queryset)

    @staticmethod
    def average(queryset, field="amount"):
        values = [getattr(tx, field) for tx in queryset]
        return sum(values) / len(values) if values else 0

    @staticmethod
    def median(queryset, field="amount"):
        values = [getattr(tx, field) for tx in queryset]
        return statistics.median(values) if values else 0

    @staticmethod
    def count(queryset):
        return len(queryset)

    @staticmethod
    def min_transaction(queryset, field="amount"):
        return min(queryset, key=lambda tx: getattr(tx, field), default=None)

    @staticmethod
    def max_transaction(queryset, field="amount"):
        return max(queryset, key=lambda tx: getattr(tx, field), default=None)

    @staticmethod
    def by_category(queryset):
        totals = Counter(tx.category for tx in queryset)
        return dict(totals)

    @staticmethod
    def monthly_totals(queryset):
        totals = {}
        for tx in queryset:
            month = datetime.strptime(tx.date, "%d/%m/%Y").strftime("%Y-%m")
            totals[month] = totals.get(month, 0) + tx.amount
        return totals