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
        account_name=None,
        customer_name=None,
        buchungs_art_name=None,
        text_short_creditor=None,
        text_creditor=None,
        text_debitor=None,
        point_of_sale_and_location=None,
        acquirer_country_name=None,
        cred_iban=None,
        cred_addr_text=None,
        cred_ref_nr=None,
        cred_info=None,
        category=None,
    ):
        if category:
            queryset = queryset.filter(category=category)
        # Dates
        if start_date:
            queryset = queryset.filter(val_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(val_date__lte=end_date)

        # Amount range
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)

        # Direction (exact match, since it's a choice field)
        if direction:
            queryset = queryset.filter(direction=direction)

        # Country
        if country:
            queryset = queryset.filter(acquirer_country_name__icontains=country)

        # Strings (LIKE searches)
        if produkt:
            queryset = queryset.filter(produkt__icontains=produkt)
        if account_name:
            queryset = queryset.filter(account_name__icontains=account_name)
        if customer_name:
            queryset = queryset.filter(customer_name__icontains=customer_name)
        if buchungs_art_name:
            queryset = queryset.filter(buchungs_art_name__icontains=buchungs_art_name)
        if text_short_creditor:
            queryset = queryset.filter(text_short_creditor__icontains=text_short_creditor)
        if text_creditor:
            queryset = queryset.filter(text_creditor__icontains=text_creditor)
        if text_debitor:
            queryset = queryset.filter(text_debitor__icontains=text_debitor)
        if point_of_sale_and_location:
            queryset = queryset.filter(point_of_sale_and_location__icontains=point_of_sale_and_location)
        if acquirer_country_name:
            queryset = queryset.filter(acquirer_country_name__icontains=acquirer_country_name)
        if cred_iban:
            queryset = queryset.filter(cred_iban__icontains=cred_iban)
        if cred_addr_text:
            queryset = queryset.filter(cred_addr_text__icontains=cred_addr_text)
        if cred_ref_nr:
            queryset = queryset.filter(cred_ref_nr__icontains=cred_ref_nr)
        if cred_info:
            queryset = queryset.filter(cred_info__icontains=cred_info)

        # Example for payment_method (if you map it to a field in the model)
        if payment_method:
            print(len(queryset))
            print(payment_method)
            queryset = queryset.filter(trx_type_name__icontains=payment_method)

            print(len(queryset))
        return queryset
