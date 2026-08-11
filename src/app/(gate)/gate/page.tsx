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
import type { GateEventLookup, GateValidationResponse } from "@/types/gate";

type AuthState = "loading" | "guest" | "wrong-role" | "gate";

export default function GatePage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [code, setCode] = useState("");
  const [resolvedEvent, setResolvedEvent] = useState<GateEventLookup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<GateValidationResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe()
      .then(({ user }) => setAuthState(user.role === "GATE" ? "gate" : "wrong-role"))
      .catch(() => setAuthState("guest"));
  }, []);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  function handleAuthOrGenericError(err: unknown, fallback: string) {
    if (err instanceof ApiError && err.status === 401) {
      setAuthState("guest");
      setFormError("Sua sessão expirou. Entre novamente para continuar.");
    } else if (err instanceof ApiError && err.status === 403) {
      setAuthState("wrong-role");
    } else {
      setFormError(err instanceof ApiError ? err.message : fallback);
    }
  }

  // Etapa 1: ler ou digitar o código só descobre a sessão a que ele
  // pertence — ainda não consome o ingresso (findTicketEvent é leitura
  // pura no backend). O porteiro confere a sessão exibida antes de
  // confirmar a entrada na etapa 2.
  async function handleLookup(submittedCode: string) {
    setSubmitting(true);
    setFormError(null);
    setResult(null);

    try {
      const resolved = await findTicketEvent(submittedCode).catch((err) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      });

      if (!resolved) {
        setResult({ result: "INVALID", ticket: null });
        setCode("");
        return;
      }

      setResolvedEvent(resolved.event);
      setCode(submittedCode);
    } catch (err) {
      handleAuthOrGenericError(err, "Não foi possível buscar o ingresso.");
    } finally {
      setSubmitting(false);
    }
  }

  // Etapa 2: só aqui o ingresso é de fato validado (e marcado como
  // utilizado, se válido).
  async function handleConfirmValidate() {
    if (!resolvedEvent) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await validateTicket({ eventId: resolvedEvent.id, code });
      setResult(response);
      setResolvedEvent(null);
      setCode("");
    } catch (err) {
      handleAuthOrGenericError(err, "Não foi possível validar o ingresso.");
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  function handleCancelLookup() {
    setResolvedEvent(null);
    setCode("");
    setFormError(null);
    inputRef.current?.focus();
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

  return (
    <main className="min-h-dvh px-10 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold">
            Cine<span className="text-accent-lime">Verzel</span>
          </span>
          <span className="text-xs font-medium text-text-mute">Portaria</span>
        </div>
        <button type="button" onClick={handleLogout} className="text-sm text-text-dim hover:text-foreground">
          Sair
        </button>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-5">
        {resolvedEvent ? (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <span className="mb-1.5 block text-xs text-text-mute">Sessão do ingresso</span>
            <span className="mb-1 block font-heading text-base font-bold">
              {resolvedEvent.title}
            </span>
            <span className="mb-5 block text-sm text-text-dim">
              {venueLabels[resolvedEvent.venue]} · Sala {resolvedEvent.room} ·{" "}
              {formatEventDateTime(resolvedEvent.startsAt)}
            </span>

            {formError && (
              <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {formError}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirmValidate}
              disabled={submitting}
              className="mb-2.5 w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Validando..." : "Validar ingresso"}
            </button>
            <button
              type="button"
              onClick={handleCancelLookup}
              disabled={submitting}
              className="w-full text-center text-sm text-text-dim hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ler outro código
            </button>
          </div>
        ) : (
          <GateValidationForm
            code={code}
            onCodeChange={setCode}
            submitting={submitting}
            error={formError}
            onSubmit={handleLookup}
            inputRef={inputRef}
            submitLabel="Buscar sessão"
            submittingLabel="Buscando..."
          />
        )}

        {result && <ValidationResult response={result} />}
      </div>
    </main>
  );
}
