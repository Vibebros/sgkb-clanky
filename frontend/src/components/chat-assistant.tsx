"use client";

import { useEffect, useRef, useState } from "react";

import {
  ExpandableChat,
  ExpandableChatBody,
  ExpandableChatFooter,
  ExpandableChatHeader,
} from "@/components/ui/expandable-chat";
import { Button } from "@/components/ui/button";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface NormalizedResponse {
  status: string;
  message: string;
  data?: {
    einnahmen?: Array<Record<string, unknown>>;
    ausgaben?: Array<Record<string, unknown>>;
    db_result?: {
      rows: Array<Record<string, unknown>>;
      total: number;
    };
    advisor_output?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

const CHAT_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_ENDPOINT ?? "http://127.0.0.1:8000/chat/";

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage({
      role: "assistant",
      content: "Hallöchen! Ich bin Clanky, dein gut gelaunter Finanz-Kumpel der SGKB. Was liegt an?",
    }),
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Zeig mir meine höchsten Ausgaben im letzten Monat",
    "Welche Abos kosten mich jeden Monat Geld?",
    "Wie viel habe ich für Reisen in 2024 ausgegeben?",
    "Welche Einnahmen hatte ich im August?",
    "Gibt es ungewohnte Ausgaben in den letzten 14 Tagen?",
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    const updatedHistory = [...messages, createMessage({ role: "user", content: trimmed })];
    setMessages(updatedHistory);
    setDraft("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: updatedHistory.map(({ role, content }) => ({ role, content })),
        }),
      });

      const payload = (await response.json()) as NormalizedResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Der Assistent konnte nicht antworten.");
      }

      const replyMessages = buildAssistantReply(payload);
      setMessages((prev) => [...prev, ...replyMessages]);
    } catch (err) {
      const fallback = err instanceof Error ? err.message : "Unbekannter Fehler beim Senden.";
      setError(fallback);
      setMessages((prev) => [
        ...prev,
        createMessage({ role: "assistant", content: `Oh nein, da hat etwas nicht geklappt: ${fallback}` }),
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend() {
    await sendMessage(draft);
  }

  return (
    <ExpandableChat
      position="bottom-right"
      size="md"
      icon={
        <img
          src="/clanky/icon-removed-background.png"
          alt="Clanky"
          className="h-8 w-8 rounded-full object-cover"
        />
      }
    >
      <ExpandableChatHeader className="bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
            <img
              src="/clanky/icon-removed-background.png"
              alt="Clanky"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">Clanky • SGKB Assistent</h3>
            <p className="text-xs text-green-600">Immer gut gelaunt an deiner Seite</p>
          </div>
        </div>
      </ExpandableChatHeader>
      <ExpandableChatBody>
        <div ref={scrollRef} className="flex h-full flex-col gap-3 overflow-y-auto bg-white p-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
              key={suggestion}
              type="button"
              className="rounded-full border border-green-600 px-3 py-1 text-xs text-green-700 transition hover:bg-green-50"
              onClick={() => sendMessage(suggestion)}
              disabled={isSending}
            >
                {suggestion}
              </button>
            ))}
          </div>
          {messages.map((message) => (
            <div
              key={message.id}
          className={
            message.role === "user"
              ? "ml-auto max-w-[85%] rounded-xl bg-green-600 px-4 py-2 text-white"
              : "mr-auto max-w-[85%] rounded-xl bg-gray-100 px-4 py-2 text-gray-800 whitespace-pre-line"
          }
            >
              {message.content}
            </div>
          ))}
          {isSending && (
            <div className="mr-auto rounded-xl bg-gray-100 px-4 py-2 text-gray-500">
              Einen Moment bitte …
            </div>
          )}
        </div>
      </ExpandableChatBody>
      <ExpandableChatFooter>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Frag Clanky etwas rund um deine Finanzen …"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <Button type="submit" size="sm" disabled={isSending}>
            Senden
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}

function buildAssistantReply(payload: NormalizedResponse): ChatMessage[] {
  if (!payload) {
    return [createMessage({ role: "assistant", content: "Ich konnte leider keine Antwort erzeugen." })];
  }

  let message = payload.message?.trim();
  const responses: ChatMessage[] = [];
  if (message) {
    responses.push(createMessage({ role: "assistant", content: message }));
  }

  const data = payload.data;

  if (data && Array.isArray(data.einnahmen) && data.einnahmen.length > 0) {
    const header = createMessage({
      role: "assistant",
      content: "Hier ist die Übersicht deiner Einnahmen:",
    });
    responses.push(header);
    data.einnahmen.slice(0, 5).forEach((entry, index) => {
      responses.push(
        createMessage({
          role: "assistant",
          content: formatTransaction(entry, index + 1),
        }),
      );
    });
    if (data.einnahmen.length > 5) {
      responses.push(
        createMessage({
          role: "assistant",
          content: `… plus ${data.einnahmen.length - 5} weitere Einnahmen im Hintergrund. Sag Bescheid, wenn ich alle auflisten soll!`,
        }),
      );
    }
  }

  if (data && Array.isArray(data.ausgaben) && data.ausgaben.length > 0) {
    const header = createMessage({
      role: "assistant",
      content: "Und hier die größten Ausgaben, frisch aus dem Kontobuch:",
    });
    responses.push(header);
    data.ausgaben.slice(0, 5).forEach((entry, index) => {
      responses.push(
        createMessage({
          role: "assistant",
          content: formatTransaction(entry, index + 1),
        }),
      );
    });
    if (data.ausgaben.length > 5) {
      responses.push(
        createMessage({
          role: "assistant",
          content: `… und noch ${data.ausgaben.length - 5} weitere Ausgaben warten auf dich.`,
        }),
      );
    }
  }

  if (
    data &&
    data.db_result &&
    Array.isArray((data.db_result as { rows?: unknown[] }).rows) &&
    (data.db_result as { total?: number }).total !== undefined
  ) {
    const rows = (data.db_result as { rows: Array<Record<string, unknown>> }).rows;
    const total = (data.db_result as { total: number }).total;

    responses.push(
      createMessage({
        role: "assistant",
        content:
          total === 0
            ? "Ich habe keine passenden Transaktionen gefunden. Probier gern einen anderen Zeitraum."
            : `Ich habe ${total} passende Transaktion${total === 1 ? "" : "en"} gefunden. Hier ein kurzer Auszug:`,
      }),
    );

    rows.slice(0, 5).forEach((row, index) => {
      responses.push(
        createMessage({
          role: "assistant",
          content: formatTransaction(row, index + 1),
        }),
      );
    });
    if (rows.length > 5) {
      responses.push(
        createMessage({
          role: "assistant",
          content: `… plus ${rows.length - 5} weitere Datensätze im Gesamtpaket.`,
        }),
      );
    }
  }

  if (
    data &&
    !data.db_result &&
    Array.isArray((data as { rows?: unknown[] }).rows) &&
    (data as { total?: number }).total !== undefined
  ) {
    const rows = (data as { rows: Array<Record<string, unknown>> }).rows;
    const total = (data as { total: number }).total;

    if (!responses.length) {
      responses.push(
        createMessage({
          role: "assistant",
          content:
            total === 0
              ? "Ich habe keine passenden Transaktionen gefunden. Probier gern einen anderen Zeitraum."
              : `Ich habe ${total} passende Transaktion${total === 1 ? "" : "en"} gefunden. Hier ein kurzer Auszug:`,
        }),
      );
    }

    rows.slice(0, 5).forEach((row, index) => {
      responses.push(
        createMessage({
          role: "assistant",
          content: formatTransaction(row, index + 1),
        }),
      );
    });
  }

  if (data && data.advisor_output && typeof data.advisor_output === "object") {
    const advisor = data.advisor_output as {
      recommendation?: string;
      key_insights?: unknown[];
      evidence?: unknown[];
      caveats?: unknown[];
    };

    if (advisor.recommendation) {
      responses.push(
        createMessage({ role: "assistant", content: String(advisor.recommendation) }),
      );
    }

    if (Array.isArray(advisor.key_insights) && advisor.key_insights.length) {
      advisor.key_insights.forEach((insight, index) => {
        responses.push(
          createMessage({
            role: "assistant",
            content: `• ${String(insight)}`,
          }),
        );
      });
    }

    if (Array.isArray(advisor.evidence) && advisor.evidence.length) {
      responses.push(
        createMessage({
          role: "assistant",
          content: "Nachweise / Zahlenbasis:",
        }),
      );
      advisor.evidence.forEach((item) => {
        responses.push(
          createMessage({
            role: "assistant",
            content: `   ↳ ${String(item)}`,
          }),
        );
      });
    }

    if (Array.isArray(advisor.caveats) && advisor.caveats.length) {
      responses.push(
        createMessage({
          role: "assistant",
          content: "Hinweise:" ,
        }),
      );
      advisor.caveats.forEach((item) => {
        responses.push(
          createMessage({
            role: "assistant",
            content: `   ⚠️ ${String(item)}`,
          }),
        );
      });
    }
  }

  if (responses.length === 0) {
    switch (payload.status) {
      case "success":
        responses.push(createMessage({ role: "assistant", content: "Alles erledigt – jederzeit gerne wieder!" }));
        break;
      case "clarification_required":
        responses.push(
          createMessage({
            role: "assistant",
            content: "Magst du mir noch etwas genauer beschreiben, was du brauchst?",
          }),
        );
        break;
      case "rejected":
        responses.push(
          createMessage({
            role: "assistant",
            content: "Das darf ich leider nicht anstoßen, aber ich helfe dir gern bei etwas anderem!",
          }),
        );
        break;
      default:
        responses.push(
          createMessage({
            role: "assistant",
            content: "Ups, da ist mir ein Fehler passiert. Probier es bitte gleich nochmal.",
          }),
        );
        break;
    }
  }

  return responses;
}

function createMessage(partial: Omit<ChatMessage, "id">): ChatMessage {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return { id, ...partial };
}

function formatTransaction(entry: Record<string, unknown>, index: number): string {
  const amountValue = entry.amount ?? entry["amount"];
  const amount =
    typeof amountValue === "number"
      ? formatCurrency(amountValue)
      : typeof amountValue === "string"
        ? amountValue
        : "-";
  const currency = valueOrFallback(entry.trx_curry_name ?? entry["trxCurryName"], "CHF");
  const direction = valueOrFallback(entry.direction, "");
  const arrow = direction === 1 || direction === "1" ? "⬆" : direction === 2 || direction === "2" ? "⬇" : "•";
  const date = valueOrFallback(entry.val_date ?? entry["valDate"], "?" as const);
  const rawDescription =
    entry.text_creditor ??
    entry["textCreditor"] ??
    entry.text_debitor ??
    entry["textDebitor"] ??
    "";
  const description = cleanDescription(String(rawDescription));
  const accountRaw = valueOrFallback(entry.account_name ?? entry["accountName"], "Unbekanntes Konto" as const);
  const account = shortenAccount(accountRaw);

  return `${index}. ${date} • ${arrow} ${amount} ${currency}
${description}
Konto: ${account}`;
}

function valueOrFallback(value: unknown, fallback: string): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function cleanDescription(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "(ohne Beschreibung)";
  }
  const withoutAccount = trimmed.split("(")[0];
  const withoutPhone = withoutAccount.split(/\+\d{6,}/)[0];
  const collapsed = withoutPhone.replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").replace(/,\s+/g, ", ");
  return collapsed || "(ohne Beschreibung)";
}

function shortenAccount(account: string): string {
  const parts = account.split("/");
  return parts[0]?.trim() || account;
}

const currencyFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
