from django.contrib import admin
from django import forms
from .models import BankTransaction


class UploadExcelForm(forms.Form):
    excel_file = forms.FileField()


@admin.register(BankTransaction)
class BankTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "trx_id",
        "customer_name",
        "account_name",
        "amount",
        "trx_curry_name",
        "trx_date",
        "val_date",
        "trx_type_short",
        "buchungs_art_short",
        "direction",
    )
    list_filter = (
        "trx_curry_name",
        "trx_type_short",
        "buchungs_art_short",
        "acquirer_country_name",
        "trx_date",
        "val_date",
    )
    search_fields = (
        "trx_id",
        "customer_name",
        "account_name",
        "text_creditor",
        "text_debitor",
        "cred_iban",
        "cred_ref_nr",
    )
    ordering = ("-trx_date",)
    date_hierarchy = "trx_date"

    fieldsets = (
        ("General Info", {
            "fields": ("trx_id", "trx_type_id", "trx_type_short", "trx_type_name", "buchungs_art_short", "buchungs_art_name")
        }),
        ("Account & Customer", {
            "fields": ("account_name", "currency_type", "macc_type", "produkt", "customer_name")
        }),
        ("Transaction Details", {
            "fields": ("val_date", "trx_date", "direction", "amount", "trx_curry_id", "trx_curry_name")
        }),
        ("Texts", {
            "fields": ("text_short_creditor", "text_creditor", "text_short_debitor", "text_debitor")
        }),
        ("POS & Acquirer", {
            "fields": ("point_of_sale_and_location", "acquirer_country_id", "acquirer_country_name", "card_id")
        }),
        ("Creditor Info", {
            "fields": ("cred_acc_text", "cred_iban", "cred_addr_text", "cred_ref_nr", "cred_info")
        }),
    )
