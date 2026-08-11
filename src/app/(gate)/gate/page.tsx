"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { appRoutes } from "@/config/routes";
import { GateValidationForm } from "@/features/gate/GateValidationForm";
import { ValidationResult } from "@/features/gate/ValidationResult";
import { ApiError } from "@/lib/api-client";
import { formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import { getMe, logout } from "@/services/auth";
import { findTicketEvent, validateTicket } from "@/services/gate";
import { listPublishedEvents } from "@/services/public-events";
import type { EventSummary } from "@/types/event";
import type { GateValidationResponse } from "@/types/gate";

const selectClassName =
  "w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent-cyan";

type AuthState = "loading" | "guest" | "wrong-role" | "gate";

export default function GatePage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<GateValidationResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe()
      .then(({ user }) => setAuthState(user.role === "GATE" ? "gate" : "wrong-role"))
      .catch(() => setAuthState("guest"));
  }, []);

  useEffect(() => {
    if (authState !== "gate") return;

    listPublishedEvents()
      .then((data) => setEvents(data.events))
      .catch(() => {});
  }, [authState]);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  async function handleValidate(submittedCode: string) {
    setSubmitting(true);
    setFormError(null);

    try {
      let eventId = selectedEventId;

      if (!eventId) {
        // Primeira leitura sem evento escolhido: descobre o evento pelo
        // próprio código, em vez de obrigar o porteiro a escolher num
        // dropdown antes de começar a validar.
        const resolved = await findTicketEvent(submittedCode).catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        });

        if (!resolved) {
          setResult({ result: "INVALID", ticket: null });
          setCode("");
          return;
        }

        eventId = resolved.event.id;
        setSelectedEventId(eventId);
      }

      const response = await validateTicket({ eventId, code: submittedCode });
      setResult(response);
      setCode("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthState("guest");
        setFormError("Sua sessão expirou. Entre novamente para continuar.");
      } else if (err instanceof ApiError && err.status === 403) {
        setAuthState("wrong-role");
      } else {
        setFormError(
          err instanceof ApiError ? err.message : "Não foi possível validar o ingresso.",
        );
      }
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  if (authState === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando...</p>
      </main>
    );
  }

  if (authState === "guest") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Entre com uma conta da portaria para validar ingressos.</p>
        <Link href={appRoutes.login} className="text-sm text-accent-cyan hover:text-accent-lime">
          Ir para o login
        </Link>
      </main>
    );
  }

  if (authState === "wrong-role") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Acesso restrito à equipe de portaria.</p>
        <Link href={appRoutes.profile} className="text-sm text-accent-cyan hover:text-accent-lime">
          Voltar ao perfil
        </Link>
      </main>
    );
  }

  const selectedEvent = events?.find((event) => event.id === selectedEventId) ?? null;

  return (
    <main className="min-h-dvh px-10 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold">
            Cine<span className="text-accent-lime">Verzel</span>
          </span>
          <span className="text-xs font-medium text-text-mute">Portaria</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-text-dim">
          {selectedEvent && (
            <span>
              {selectedEvent.title} · {formatEventDateTime(selectedEvent.startsAt)}
            </span>
          )}
          <button type="button" onClick={handleLogout} className="hover:text-foreground">
            Sair
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div>
          <label htmlFor="gate-event" className="mb-1.5 block text-xs text-text-mute">
            Evento em operação
          </label>
          {events && events.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-dim">
              Nenhum evento publicado no momento.
            </p>
          ) : (
            <select
              id="gate-event"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={!events}
              className={`${selectClassName} disabled:opacity-50`}
            >
              <option value="">
                {events ? "Detectar automaticamente pela leitura" : "Carregando eventos..."}
              </option>
              {events?.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} — {venueLabels[event.venue]} · {formatEventDateTime(event.startsAt)}
                </option>
              ))}
            </select>
          )}
        </div>

        <GateValidationForm
          code={code}
          onCodeChange={setCode}
          submitting={submitting}
          error={formError}
          onSubmit={handleValidate}
          inputRef={inputRef}
        />

        {result && <ValidationResult response={result} />}
      </div>
    </main>
  );
}
