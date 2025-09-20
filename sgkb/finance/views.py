import csv
import datetime
import io
import json
import openpyxl

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView

from ai_manager.utils import ClankyMultiAgentSystem, NormalizedResponse
from finance.models import BankTransaction


def current_datetime(request):
    now = datetime.datetime.now()
    html = '<html lang="en"><body>It is now %s.</body></html>' % now
    return HttpResponse(html)


def _build_human_readable_reply(result: NormalizedResponse) -> str:
    """Convert the NormalizedResponse into a user-facing German sentence."""

    if result.status == "clarification_required":
        return result.message or "Magst du mir noch ein paar Details geben? Dann helfe ich dir super gerne!"

    if result.status == "rejected":
        return result.message or "Au weia, das darf ich leider nicht erledigen – vielleicht probierst du es anders?"

    if result.status == "error":
        return result.message or "Hoppla, da ist etwas schiefgelaufen. Versuch es bitte gleich noch einmal!"

    # success path
    if result.message:
        return result.message

    # If we only have data, create a short fallback summary.
    data = result.data or {}
    if isinstance(data, dict):
        if "advisor_output" in data and isinstance(data["advisor_output"], dict):
            recommendation = data["advisor_output"].get("recommendation")
            if recommendation:
                return recommendation
        if "db_result" in data and isinstance(data["db_result"], dict):
            total = data["db_result"].get("total")
            return f"Ich habe {total} passende Transaktionen gefunden." if total is not None else "Hier sind die angefragten Daten."

    return "Alles klar! Ich habe deine Anfrage fröhlich bearbeitet." 


@method_decorator(csrf_exempt, name="dispatch")
class ChatBotView(TemplateView):
    template_name = "chat.html"

    _assistant: ClankyMultiAgentSystem | None = None

    @classmethod
    def _get_assistant(cls) -> ClankyMultiAgentSystem:
        if cls._assistant is None:
            cls._assistant = ClankyMultiAgentSystem()
        return cls._assistant

    def get(self, request, *args, **kwargs):
        history = request.session.get("chat_history", [])
        return render(request, self.template_name, {"history": history})

    def post(self, request, *args, **kwargs):
        is_json_request = request.content_type == "application/json"
        payload: dict[str, object] = {}
        history_data: list[dict[str, str]] = []

        if is_json_request:
            if not request.body:
                return JsonResponse({"error": "Empty request body."}, status=400)
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON payload."}, status=400)

            message = payload.get("message") if isinstance(payload, dict) else None
            if not isinstance(message, str) or not message.strip():
                return JsonResponse({"error": "Missing 'message' field."}, status=400)
            message = message.strip()

            payload_history = payload.get("history") if isinstance(payload, dict) else None
            if isinstance(payload_history, list):
                for entry in payload_history:
                    if not isinstance(entry, dict):
                        continue
                    role = entry.get("role")
                    content = entry.get("content")
                    if role in {"user", "assistant"} and isinstance(content, str):
                        history_data.append({"role": role, "content": content})
        else:
            message = request.POST.get("message") or request.body.decode().strip()
            if not message:
                history = request.session.get("chat_history", [])
                return render(
                    request,
                    self.template_name,
                    {"history": history, "error": "Bitte gib eine Nachricht ein."},
                )

            session_history = request.session.get("chat_history", [])
            if isinstance(session_history, list):
                for entry in session_history:
                    if isinstance(entry, dict) and entry.get("role") in {"user", "assistant"}:
                        content = entry.get("content")
                        if isinstance(content, str):
                            history_data.append({"role": entry["role"], "content": content})
            message = message.strip()

        assistant = self._get_assistant()

        try:
            result = assistant.run(message, history=history_data)
        except Exception as exc:  # pragma: no cover - safety net
            if is_json_request:
                return JsonResponse(
                    {"error": "Assistant processing failed.", "details": str(exc)},
                    status=500,
                )
            history = request.session.get("chat_history", [])
            history.append({"role": "assistant", "content": f"Fehler: {exc}"})
            request.session["chat_history"] = history
            return render(request, self.template_name, {"history": history})

        if is_json_request:
            payload = {
                "status": result.status,
                "message": result.message,
                "data": result.data,
            }
            status_code = 200 if result.status != "error" else 500
            return JsonResponse(payload, status=status_code)

        history = request.session.get("chat_history", [])
        if not isinstance(history, list):
            history = []

        history.append({"role": "user", "content": message})
        assistant_message = _build_human_readable_reply(result)
        history.append({"role": "assistant", "content": assistant_message})
        request.session["chat_history"] = history[-20:]

        context = {
            "history": history,
            "assistant_message": assistant_message,
        }
        return render(request, self.template_name, context)


class DashboardView(TemplateView):
    template_name = "dashboard.html"


class PartnersView(TemplateView):
    template_name = "partners.html"


class ExportTransactionsCSV(View):
    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="transactions.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ZEILEN_NR", "MONEY_ACCOUNT_NAME", "MAC_CURRY_ID", "MAC_CURRY_NAME",
            "MACC_TYPE", "PRODUKT", "KUNDEN_NAME", "TRX_ID", "TRX_TYPE_ID",
            "TRX_TYPE_SHORT", "TRX_TYPE_NAME", "BUCHUNGS_ART_SHORT", "BUCHUNGS_ART_NAME",
            "VAL_DATE", "TRX_DATE", "DIRECTION", "AMOUNT", "TRX_CURRY_ID", "TRX_CURRY_NAME",
            "TEXT_SHORT_CREDITOR", "TEXT_CREDITOR", "TEXT_SHORT_DEBITOR", "TEXT_DEBITOR",
            "POINT_OF_SALE_AND_LOCATION", "ACQUIRER_COUNTRY_ID", "ACQUIRER_COUNTRY_NAME",
            "CARD_ID", "CRED_ACC_TEXT", "CRED_IBAN", "CRED_ADDR_TEXT", "CRED_REF_NR", "CRED_INFO"
        ])

        for idx, tx in enumerate(BankTransaction.objects.all(), start=1):
            writer.writerow([
                idx,
                tx.account_name,
                "",
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

        ws.append([
            "ZEILEN_NR", "MONEY_ACCOUNT_NAME", "MAC_CURRY_ID", "MAC_CURRY_NAME",
            "MACC_TYPE", "PRODUKT", "KUNDEN_NAME", "TRX_ID", "TRX_TYPE_ID",
            "TRX_TYPE_SHORT", "TRX_TYPE_NAME", "BUCHUNGS_ART_SHORT", "BUCHUNGS_ART_NAME",
            "VAL_DATE", "TRX_DATE", "DIRECTION", "AMOUNT", "TRX_CURRY_ID", "TRX_CURRY_NAME",
            "TEXT_SHORT_CREDITOR", "TEXT_CREDITOR", "TEXT_SHORT_DEBITOR", "TEXT_DEBITOR",
            "POINT_OF_SALE_AND_LOCATION", "ACQUIRER_COUNTRY_ID", "ACQUIRER_COUNTRY_NAME",
            "CARD_ID", "CRED_ACC_TEXT", "CRED_IBAN", "CRED_ADDR_TEXT", "CRED_REF_NR", "CRED_INFO"
        ])

        for idx, tx in enumerate(BankTransaction.objects.all(), start=1):
            ws.append([
                idx,
                tx.account_name,
                "",
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
