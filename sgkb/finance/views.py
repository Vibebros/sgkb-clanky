import csv
import openpyxl
import io
from django.http import HttpResponse
import datetime
from django.views import View
from django.views.generic import TemplateView
from .models import BankTransaction


def current_datetime(request):
    now = datetime.datetime.now()
    html = '<html lang="en"><body>It is now %s.</body></html>' % now
    return HttpResponse(html)


class ChatBotView(TemplateView):
    template_name = "chat.html"


class DashboardView(TemplateView):
    template_name = "dashboard.html"


class PartnersView(TemplateView):
    template_name = "partners.html"


import csv
from django.http import HttpResponse
from django.views import View
from finance.models import BankTransaction


class ExportTransactionsCSV(View):
    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="transactions.csv"'

        writer = csv.writer(response)
        # Header row (your requested format)
        writer.writerow([
            "ZEILEN_NR", "MONEY_ACCOUNT_NAME", "MAC_CURRY_ID", "MAC_CURRY_NAME",
            "MACC_TYPE", "PRODUKT", "KUNDEN_NAME", "TRX_ID", "TRX_TYPE_ID",
            "TRX_TYPE_SHORT", "TRX_TYPE_NAME", "BUCHUNGS_ART_SHORT", "BUCHUNGS_ART_NAME",
            "VAL_DATE", "TRX_DATE", "DIRECTION", "AMOUNT", "TRX_CURRY_ID", "TRX_CURRY_NAME",
            "TEXT_SHORT_CREDITOR", "TEXT_CREDITOR", "TEXT_SHORT_DEBITOR", "TEXT_DEBITOR",
            "POINT_OF_SALE_AND_LOCATION", "ACQUIRER_COUNTRY_ID", "ACQUIRER_COUNTRY_NAME",
            "CARD_ID", "CRED_ACC_TEXT", "CRED_IBAN", "CRED_ADDR_TEXT", "CRED_REF_NR", "CRED_INFO"
        ])

        # Data rows
        for idx, tx in enumerate(BankTransaction.objects.all(), start=1):
            writer.writerow([
                idx,
                tx.account_name,
                "",  # MAC_CURRY_ID not in model
                tx.currency_type,
                tx.macc_type,
                tx.produkt,
                tx.customer_name,
                tx.trx_id,
                tx.trx_type_id,
                tx.trx_type_short,
                tx.trx_type_name,
                tx.buchungs_art_short,
                tx.buchungs_art_name,
                tx.val_date,
                tx.trx_date,
                tx.direction,
                tx.amount,
                tx.trx_curry_id,
                tx.trx_curry_name,
                tx.text_short_creditor,
                tx.text_creditor,
                tx.text_short_debitor,
                tx.text_debitor,
                tx.point_of_sale_and_location,
                tx.acquirer_country_id,
                tx.acquirer_country_name,
                tx.card_id,
                tx.cred_acc_text,
                tx.cred_iban,
                tx.cred_addr_text,
                tx.cred_ref_nr,
                tx.cred_info,
            ])

        return response


class ExportTransactionsExcel(View):
    def get(self, request, *args, **kwargs):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Transactions"

        # Header row
        ws.append([
            "ZEILEN_NR", "MONEY_ACCOUNT_NAME", "MAC_CURRY_ID", "MAC_CURRY_NAME",
            "MACC_TYPE", "PRODUKT", "KUNDEN_NAME", "TRX_ID", "TRX_TYPE_ID",
            "TRX_TYPE_SHORT", "TRX_TYPE_NAME", "BUCHUNGS_ART_SHORT", "BUCHUNGS_ART_NAME",
            "VAL_DATE", "TRX_DATE", "DIRECTION", "AMOUNT", "TRX_CURRY_ID", "TRX_CURRY_NAME",
            "TEXT_SHORT_CREDITOR", "TEXT_CREDITOR", "TEXT_SHORT_DEBITOR", "TEXT_DEBITOR",
            "POINT_OF_SALE_AND_LOCATION", "ACQUIRER_COUNTRY_ID", "ACQUIRER_COUNTRY_NAME",
            "CARD_ID", "CRED_ACC_TEXT", "CRED_IBAN", "CRED_ADDR_TEXT", "CRED_REF_NR", "CRED_INFO"
        ])

        # Data rows
        for idx, tx in enumerate(BankTransaction.objects.all(), start=1):
            ws.append([
                idx,
                tx.account_name,
                "",  # MAC_CURRY_ID not in model
                tx.currency_type,
                tx.macc_type,
                tx.produkt,
                tx.customer_name,
                tx.trx_id,
                tx.trx_type_id,
                tx.trx_type_short,
                tx.trx_type_name,
                tx.buchungs_art_short,
                tx.buchungs_art_name,
                tx.val_date,
                tx.trx_date,
                tx.direction,
                tx.amount,
                tx.trx_curry_id,
                tx.trx_curry_name,
                tx.text_short_creditor,
                tx.text_creditor,
                tx.text_short_debitor,
                tx.text_debitor,
                tx.point_of_sale_and_location,
                tx.acquirer_country_id,
                tx.acquirer_country_name,
                tx.card_id,
                tx.cred_acc_text,
                tx.cred_iban,
                tx.cred_addr_text,
                tx.cred_ref_nr,
                tx.cred_info,
            ])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="transactions.xlsx"'
        return response
