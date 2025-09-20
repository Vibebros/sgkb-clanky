"""Multi-agent orchestration for the SGKB finance assistant."""

from __future__ import annotations

import asyncio
import json
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any, Literal
from decimal import Decimal

from agents import Agent, RunContextWrapper, Runner, function_tool
from django.utils import timezone

from finance.models import BankTransaction
from finance.utils import TransactionFilter


ALLOWED_DB_FILTERS = {
    "start_date",
    "end_date",
    "payment_method",
    "min_amount",
    "max_amount",
    "country",
    "direction",
    "produkt",
    "account_name",
    "customer_name",
    "buchungs_art_name",
    "text_short_creditor",
    "text_creditor",
    "text_debitor",
    "point_of_sale_and_location",
    "acquirer_country_name",
    "cred_iban",
    "cred_addr_text",
    "cred_ref_nr",
    "cred_info",
}

DB_FILTER_SYNONYMS = {
    "transaktionstyp": "trx_type_name",
    "transactionstype": "trx_type_name",
    "transaction_type": "trx_type_name",
    "konto": "account_name",
    "konto_name": "account_name",
}

DEFAULT_RESULT_FIELDS = [
    "id",
    "val_date",
    "amount",
    "direction",
    "customer_name",
    "account_name",
    "trx_type_name",
    "acquirer_country_name",
    "text_creditor",
    "trx_type_short",
    "buchungs_art_name",
    "text_debitor",
]


@dataclass(slots=True)
class TaskSpec:
    task_type: Literal["fetch", "insight", "clarification", "other"]
    intent_summary: str
    filters: dict[str, Any] = field(default_factory=dict)
    timeframe: str | None = None
    entities: list[str] = field(default_factory=list)
    needs_clarification: bool = False
    clarification_question: str | None = None
    raw: str | None = None

    @classmethod
    def from_json(cls, payload: str) -> "TaskSpec":
        data = json.loads(payload)
        return cls(
            task_type=data.get("task_type", "other"),
            intent_summary=data.get("intent_summary", ""),
            filters=data.get("filters") or {},
            timeframe=data.get("timeframe"),
            entities=data.get("entities") or [],
            needs_clarification=bool(data.get("needs_clarification")),
            clarification_question=data.get("clarification_question"),
            raw=data.get("raw"),
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class RouteDecision:
    route: Literal["db_search", "financial_advisor", "clarify", "reject"]
    reason: str
    filters: dict[str, Any] = field(default_factory=dict)
    limit: int = 20
    offset: int = 0
    clarification_question: str | None = None

    @classmethod
    def from_json(cls, payload: str) -> "RouteDecision":
        data = json.loads(payload)
        return cls(
            route=data.get("route", "reject"),
            reason=data.get("reason", ""),
            filters=data.get("filters") or {},
            limit=int(data.get("limit", 20)),
            offset=int(data.get("offset", 0)),
            clarification_question=data.get("clarification_question"),
        )


@dataclass(slots=True)
class DBResult:
    total: int
    limit: int
    offset: int
    rows: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "total": self.total,
            "limit": self.limit,
            "offset": self.offset,
            "rows": self.rows,
        }


@dataclass(slots=True)
class AdvisorOutput:
    recommendation: str
    key_insights: list[str] = field(default_factory=list)
    evidence: list[str] = field(default_factory=list)
    caveats: list[str] = field(default_factory=list)

    @classmethod
    def from_json(cls, payload: str) -> "AdvisorOutput":
        data = json.loads(payload)
        return cls(
            recommendation=data.get("recommendation", ""),
            key_insights=data.get("key_insights") or [],
            evidence=data.get("evidence") or [],
            caveats=data.get("caveats") or [],
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class NormalizedResponse:
    status: Literal["success", "clarification_required", "rejected", "error"]
    message: str
    data: dict[str, Any] | None = None

    @classmethod
    def from_json(cls, payload: str) -> "NormalizedResponse":
        data = json.loads(payload)
        return cls(
            status=data.get("status", "error"),
            message=data.get("message", ""),
            data=data.get("data"),
        )


def _sanitize_filters(raw_filters: dict[str, Any]) -> dict[str, Any]:
    sanitized: dict[str, Any] = {}

    normalized_inputs: dict[str, Any] = {}
    for raw_key, value in raw_filters.items():
        key = DB_FILTER_SYNONYMS.get(raw_key, raw_key)
        normalized_inputs[key] = value

    for key in ALLOWED_DB_FILTERS:
        if key not in normalized_inputs:
            continue
        value = normalized_inputs[key]
        if value in (None, ""):
            continue
        if key in {"start_date", "end_date"} and isinstance(value, str):
            sanitized[key] = value
        elif key in {"min_amount", "max_amount"}:
            try:
                sanitized[key] = float(value)
            except (TypeError, ValueError):
                continue
        elif key == "direction":
            try:
                sanitized[key] = int(value)
            except (TypeError, ValueError):
                continue
        else:
            sanitized[key] = value
    return sanitized


def _run_transaction_query(
    filters: dict[str, Any],
    *,
    limit: int = 20,
    offset: int = 0,
    fields: list[str] | None = None,
) -> DBResult:
    capped_limit = max(1, min(int(limit), 100))
    safe_offset = max(0, int(offset))
    selected_fields = fields or DEFAULT_RESULT_FIELDS

    queryset = BankTransaction.objects.all()
    queryset = TransactionFilter.apply(queryset, **filters)
    total = queryset.count()
    window = queryset.order_by("-val_date")[safe_offset : safe_offset + capped_limit]
    rows = list(window.values(*selected_fields))

    for row in rows:
        for key, value in list(row.items()):
            if isinstance(value, date):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)

    return DBResult(total=total, limit=capped_limit, offset=safe_offset, rows=rows)


@function_tool
async def db_searcher_tool(
    ctx: RunContextWrapper[Any],
    filters_json: str | None = None,
    limit: int = 20,
    offset: int = 0,
    fields: list[str] | None = None,
) -> dict[str, Any]:
    if filters_json:
        try:
            raw_filters = json.loads(filters_json)
        except json.JSONDecodeError:
            return {
                "error": "filters_json must be valid JSON",
                "total": 0,
                "limit": int(limit),
                "offset": int(offset),
                "rows": [],
            }
        if not isinstance(raw_filters, dict):
            return {
                "error": "filters_json must decode to an object",
                "total": 0,
                "limit": int(limit),
                "offset": int(offset),
                "rows": [],
            }
    else:
        raw_filters = {}

    sanitized = _sanitize_filters(raw_filters)
    result = await asyncio.to_thread(
        _run_transaction_query,
        sanitized,
        limit=limit,
        offset=offset,
        fields=fields,
    )
    return result.to_dict()


class ClankyMultiAgentSystem:
    """Coordinates the Conversational, Orchestrator, and Advisor roles."""

    def __init__(self) -> None:
        self.conversational_agent = Agent(
            name="Clanky_Conversational",
            instructions=(
                "Du bist Clanky, ein verspielter, zuvorkommender Bank-Assistent. "
                "Du sprichst freundlich auf Deutsch, auch wenn die Nutzerin eine andere Sprache nutzt. "
                "Analysiere jede Nutzeranfrage und antworte ausschließlich mit JSON, das eine TaskSpec enthält. Die Felder müssen sein: "
                "task_type (eines von ['fetch','insight','clarification','information_request','greeting','smalltalk','other']), intent_summary (kurz & charmant), filters (Objekt mit einfachen Werten), timeframe (String oder Objekt), entities (Liste), needs_clarification (Bool) und clarification_question (oder null). "
                "Nutze 'clarification' nur, wenn du wirklich eine Rückfrage brauchst. Wenn du einen Datums- oder Smalltalk-Wunsch erkennst, setze task_type entsprechend. Keine Texte außerhalb des JSON."),
        )

        self.orchestrator_agent = Agent(
            name="Clanky_Orchestrator",
            instructions=(
                "Du spielst Clankys Orchestrator und bleibst ebenso freundlich. "
                "Du entscheidest, wie eine TaskSpec bearbeitet wird. Verfügbare Routen: 'db_search', 'financial_advisor', 'clarify', 'reject'. "
                "Input ist JSON mit phase ('routing' oder 'finalize') und einer TaskSpec. "
                "Beim Routing gib JSON mit route, reason, filters, limit, offset und optional "
                "clarification_question zurück. Beim Finalisieren gib JSON mit status, message "
                "(Deutsch, warmherzig) und data zurück. Formuliere reason/clarification_question so, dass sie freundlich und leicht verspielt sind."),
        )

        self.financial_advisor_agent = Agent(
            name="Financial_Advisor",
            instructions=(
                "Du erstellst als Clanky-Advisor Finanzanalysen in deutscher Sprache. "
                "Bleibe positiv, motivierend und klar: gib hilfreiche Tipps mit einem leichten Augenzwinkern. "
                "Nutze db_searcher_tool (Parameter filters_json) um Daten abzurufen. "
                "Antworte nur mit JSON (recommendation, key_insights, evidence, caveats)."),
            tools=[db_searcher_tool],
        )

    def run(
        self,
        user_message: str,
        *,
        history: list[dict[str, str]] | None = None,
    ) -> NormalizedResponse:
        loop = self._ensure_event_loop()
        try:
            conversational_prompt = self._build_conversational_prompt(user_message, history=history)
            task_spec = self._run_conversational_agent(conversational_prompt)

            handled = self._handle_special_task(task_spec)
            if handled is not None:
                return handled

            if task_spec.needs_clarification and task_spec.clarification_question:
                return NormalizedResponse(
                    status="clarification_required",
                    message=task_spec.clarification_question,
                    data={"task_spec": task_spec.to_dict()},
                )

            routing = self._normalize_route_decision(
                self._run_orchestrator_routing(task_spec)
            )

            if routing.route == "clarify":
                return NormalizedResponse(
                    status="clarification_required",
                    message=routing.clarification_question or routing.reason,
                    data={"task_spec": task_spec.to_dict()},
                )

            if routing.route == "reject":
                return NormalizedResponse(
                    status="rejected",
                    message=routing.reason,
                    data={"task_spec": task_spec.to_dict()},
                )

            if routing.route == "db_search":
                db_filters = _sanitize_filters(routing.filters)
                db_result = _run_transaction_query(
                    db_filters,
                    limit=routing.limit,
                    offset=routing.offset,
                )
                if db_result.total == 0:
                    return NormalizedResponse(
                        status="success",
                        message=(
                            "Ich habe in den verfügbaren Daten keine passenden Transaktionen gefunden – "
                            "vielleicht war dein Konto in diesem Zeitraum besonders brav? Probier gern einen anderen Filter!"
                        ),
                        data={
                            "db_result": db_result.to_dict(),
                            "task_spec": task_spec.to_dict(),
                        },
                    )
                return self._finalize(task_spec, routing, {"db_result": db_result.to_dict()})

            if routing.route == "financial_advisor":
                advisor_output = self._run_financial_advisor(task_spec)
                return self._finalize(
                    task_spec,
                    routing,
                    {"advisor_output": advisor_output.to_dict()},
                )

            return NormalizedResponse(
                status="error",
                message="Unbekannte Routing-Entscheidung",
                data={"route": routing.route, "task_spec": task_spec.to_dict()},
            )
        finally:
            self._teardown_event_loop(loop)

    # Internals
    def _run_conversational_agent(self, prompt: str) -> TaskSpec:
        result = Runner.run_sync(self.conversational_agent, prompt)
        return TaskSpec.from_json(result.final_output)

    def _run_orchestrator_routing(self, task_spec: TaskSpec) -> RouteDecision:
        payload = {"phase": "routing", "task_spec": task_spec.to_dict()}
        result = Runner.run_sync(self.orchestrator_agent, json.dumps(payload, ensure_ascii=False))
        return RouteDecision.from_json(result.final_output)

    def _normalize_route_decision(self, decision: RouteDecision) -> RouteDecision:
        allowed = {"db_search", "financial_advisor", "clarify", "reject"}

        normalized_route = (decision.route or "").strip().lower()

        if normalized_route not in allowed:
            route_guess: str | None = None
            if normalized_route in {"transaction_search", "search", "fetch", "db", "data"} or decision.filters:
                route_guess = "db_search"
            elif normalized_route in {"advisor", "analysis", "insight", "recommendation"}:
                route_guess = "financial_advisor"
            elif normalized_route in {"clarification_required", "question", "follow_up"}:
                route_guess = "clarify"
            elif normalized_route in {"greeting", "smalltalk"}:
                route_guess = "clarify"

            if route_guess is None:
                fallback = (
                    decision.reason
                    or decision.clarification_question
                    or "Ups, magst du mir ein bisschen genauer erklären, worum es geht?"
                )
                return RouteDecision(
                    route="clarify",
                    reason=fallback,
                    filters={},
                    limit=max(1, decision.limit),
                    offset=max(0, decision.offset),
                    clarification_question=fallback,
                )

            decision.route = route_guess

        if decision.route == "db_search":
            for key in ("limit", "anzahl", "top", "count"):
                if isinstance(decision.filters.get(key), (int, float, str)):
                    try:
                        decision.limit = int(decision.filters.pop(key))
                        break
                    except (TypeError, ValueError):
                        decision.filters.pop(key, None)

        if decision.route == "db_search" and not decision.filters:
            decision.filters = {}

        safe_limit = max(1, min(int(decision.limit), 100))
        safe_offset = max(0, int(decision.offset))

        if decision.route != "db_search":
            decision.filters = {}

        decision.limit = safe_limit
        decision.offset = safe_offset
        if not decision.reason:
            decision.reason = "Ich habe den nächsten Schritt freundlich für dich vorbereitet."
        if decision.route == "clarify" and not decision.clarification_question:
            decision.clarification_question = decision.reason

        return decision

    def _run_financial_advisor(self, task_spec: TaskSpec) -> AdvisorOutput:
        result = Runner.run_sync(
            self.financial_advisor_agent,
            json.dumps(task_spec.to_dict(), ensure_ascii=False),
        )
        return AdvisorOutput.from_json(result.final_output)

    def _finalize(
        self,
        task_spec: TaskSpec,
        routing: RouteDecision,
        result_payload: dict[str, Any],
    ) -> NormalizedResponse:
        payload = {
            "phase": "finalize",
            "route": routing.route,
            "task_spec": task_spec.to_dict(),
            "result_data": result_payload,
        }
        result = Runner.run_sync(
            self.orchestrator_agent,
            json.dumps(payload, ensure_ascii=False),
        )
        response = NormalizedResponse.from_json(result.final_output)
        if response.status == "error":
            return NormalizedResponse(
                status="success",
                message="Hier sind die angefragten Daten – sag Bescheid, wenn ich sie hübscher aufbereiten soll!",
                data=result_payload,
            )
        return response

    def _build_conversational_prompt(
        self,
        user_message: str,
        *,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        if not history:
            return user_message

        snippets: list[str] = []
        for entry in history[-10:]:
            role = entry.get("role")
            content = entry.get("content")
            if role not in {"user", "assistant"} or not isinstance(content, str):
                continue
            speaker = "Nutzer" if role == "user" else "Assistent"
            snippets.append(f"{speaker}: {content}")

        if not snippets:
            return user_message

        history_block = "\n".join(snippets)
        return (
            "Bisheriger Dialog:\n"
            f"{history_block}\n"
            "Neue Nutzeranfrage: "
            f"{user_message}"
        )

    @staticmethod
    def _ensure_event_loop() -> asyncio.AbstractEventLoop | None:
        try:
            asyncio.get_running_loop()
            return None
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop

    @staticmethod
    def _teardown_event_loop(loop: asyncio.AbstractEventLoop | None) -> None:
        if loop is None:
            return
        try:
            loop.close()
        finally:
            asyncio.set_event_loop(None)

    def _handle_special_task(self, task_spec: TaskSpec) -> NormalizedResponse | None:
        task_type = (task_spec.task_type or "").lower()
        summary = (task_spec.intent_summary or "").lower()

        if task_type in {"greeting", "smalltalk"}:
            return NormalizedResponse(
                status="success",
                message="Immer wieder schön von dir zu hören! Sag mir einfach, wobei ich dir helfen darf.",
                data={"task_spec": task_spec.to_dict()},
            )

        if task_type in {"information_request", "info"}:
            today = timezone.localdate()
            if "datum" in summary or "date" in summary or task_spec.timeframe == "heute":
                return NormalizedResponse(
                    status="success",
                    message=f"Heute ist der {today.strftime('%d.%m.%Y')} – notier dir das ruhig.",
                    data={"today": today.isoformat(), "task_spec": task_spec.to_dict()},
                )

        if task_type == "clarification" and not task_spec.needs_clarification and not task_spec.clarification_question:
            return NormalizedResponse(
                status="clarification_required",
                message="Magst du mir noch ein bisschen Kontext geben, damit ich die richtige Clanky-Toolbox aufklappen kann?",
                data={"task_spec": task_spec.to_dict()},
            )

        return None


__all__ = [
    "AdvisorOutput",
    "ClankyMultiAgentSystem",
    "DBResult",
    "NormalizedResponse",
    "RouteDecision",
    "TaskSpec",
    "db_searcher_tool",
]
