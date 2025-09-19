class TransactionFilter:
    @staticmethod
    def apply(
        queryset,
        start_date=None,
        end_date=None,
        payment_method=None,
        min_amount=None,
        max_amount=None,
        country=None,
        direction=None,
        produkt=None,
        acquirer_country_name=None,
        account_name=None,
        customer_name=None,
    ):
        if start_date:
            queryset = queryset.filter(val_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(val_date__lte=end_date)
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)
        return queryset