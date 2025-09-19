import pandas as pd
from decimal import Decimal, InvalidOperation
from django.contrib import admin, messages
from django import forms
from django.shortcuts import redirect, render

from .models import BankTransaction


def safe_int(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def safe_decimal(value):
    try:
        return Decimal(str(value).replace(",", "."))  # handle comma decimals
    except (InvalidOperation, ValueError, TypeError):
        return None


class UploadCSVForm(forms.Form):
    csv_file = forms.FileField()


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


    #
    # Upload
    #


    change_list_template = "admin/banktransaction_changelist.html"
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path("upload-csv/", self.admin_site.admin_view(self.upload_csv), name="banktransaction_upload_csv"),
        ]
        return custom_urls + urls


    def upload_csv(self, request):
        if request.method == "POST":
            form = UploadCSVForm(request.POST, request.FILES)
            if form.is_valid():
                csv_file = request.FILES["csv_file"]

                try:
                    df = pd.read_csv(csv_file, sep=",")
                    df = df.fillna("")  # Replace NaN with empty string

                    for _, row in df.iterrows():
                        BankTransaction.objects.create(
                            account_name=row.get("MONEY_ACCOUNT_NAME", ""),
                            currency_type=row.get("MAC_CURRY_NAME", ""),
                            macc_type=row.get("MACC_TYPE", ""),
                            produkt=row.get("PRODUKT", ""),
                            customer_name=row.get("KUNDEN_NAME", ""),
                            trx_id=safe_int(row.get("TRX_ID")),
                            trx_type_id=safe_int(row.get("TRX_TYPE_ID")),
                            trx_type_short=row.get("TRX_TYPE_SHORT", ""),
                            trx_type_name=row.get("TRX_TYPE_NAME", ""),
                            buchungs_art_short=row.get("BUCHUNGS_ART_SHORT", ""),
                            buchungs_art_name=row.get("BUCHUNGS_ART_NAME", ""),
                            val_date=pd.to_datetime(row.get("VAL_DATE"), errors="coerce").date()
                                     if row.get("VAL_DATE") else None,
                            trx_date=pd.to_datetime(row.get("TRX_DATE"), errors="coerce").date()
                                     if row.get("TRX_DATE") else None,
                            direction=safe_int(row.get("DIRECTION")),
                            amount=safe_decimal(row.get("AMOUNT")),
                            trx_curry_id=safe_int(row.get("TRX_CURRY_ID")),
                            trx_curry_name=row.get("TRX_CURRY_NAME", ""),
                            text_short_creditor=row.get("TEXT_SHORT_CREDITOR", ""),
                            text_creditor=row.get("TEXT_CREDITOR", ""),
                            text_short_debitor=row.get("TEXT_SHORT_DEBITOR", ""),
                            text_debitor=row.get("TEXT_DEBITOR", ""),
                            point_of_sale_and_location=row.get("POINT_OF_SALE_AND_LOCATION", ""),
                            acquirer_country_id=safe_int(row.get("ACQUIRER_COUNTRY_ID")),
                            acquirer_country_name=row.get("ACQUIRER_COUNTRY_NAME", ""),
                            card_id=row.get("CARD_ID", ""),
                            cred_acc_text=row.get("CRED_ACC_TEXT", ""),
                            cred_iban=row.get("CRED_IBAN", ""),
                            cred_addr_text=row.get("CRED_ADDR_TEXT", ""),
                            cred_ref_nr=row.get("CRED_REF_NR", ""),
                            cred_info=row.get("CRED_INFO", ""),
                        )

                    self.message_user(request, "CSV file uploaded and transactions imported successfully!", level=messages.SUCCESS)

                except Exception as e:
                    self.message_user(request, f"Error while processing CSV: {e}", level=messages.ERROR)

                return redirect("..")

        else:
            form = UploadCSVForm()

        return render(request, "admin/csv_upload.html", {"form": form})