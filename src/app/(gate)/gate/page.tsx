"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { appRoutes } from "@/config/routes";
import { useToast } from "@/components/toast/ToastProvider";
import { GateValidationForm } from "@/features/gate/GateValidationForm";
import { QrCodeScanner } from "@/features/gate/QrCodeScanner";
import { ValidationResult } from "@/features/gate/ValidationResult";
import { ApiError } from "@/lib/api-client";
import { formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import { getMe, logout } from "@/services/auth";
import { findTicketEvent, validateTicket } from "@/services/gate";
import type { GateEventLookup, GateValidationResponse } from "@/types/gate";

type AuthState = "loading" | "guest" | "wrong-role" | "gate";
type InputMode = "scan" | "manual";

export default function GatePage() {
  const router = useRouter();
  const toast = useToast();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [inputMode, setInputMode] = useState<InputMode>("scan");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | undefined>(undefined);
  const [resolvedEvent, setResolvedEvent] = useState<GateEventLookup | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      toast.info("Sua sessão expirou. Entre novamente para continuar.");
    } else if (err instanceof ApiError && err.status === 403) {
      setAuthState("wrong-role");
    } else {
      toast.error(err instanceof ApiError ? err.message : fallback);
    }
  }

  // Etapa 1: ler ou digitar o código só descobre a sessão a que ele
  // pertence — ainda não consome o ingresso (findTicketEvent é leitura
  // pura no backend). O porteiro confere a sessão exibida antes de
  // confirmar a entrada na etapa 2.
  async function handleLookup(submittedCode: string, submittedToken?: string) {
    setSubmitting(true);
    setResult(null);

    try {
      const resolved = await findTicketEvent(submittedCode).catch((err) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      });

      if (!resolved) {
        setResult({ result: "INVALID", ticket: null, reason: "Código não encontrado." });
        setCode("");
        setToken(undefined);
        return;
      }

      setResolvedEvent(resolved.event);
      setCode(submittedCode);
      setToken(submittedToken);
    } catch (err) {
      handleAuthOrGenericError(err, "Não foi possível buscar o ingresso.");
    } finally {
      setSubmitting(false);
    }
  }

  // O QR do ingresso codifica "<code>.<hmac>" (ver QrTicket.tsx) — a câmera
  // devolve essa string crua. Separa as duas partes aqui antes de seguir
  // pro mesmo fluxo da digitação manual; o hmac (token) só existe nesse
  // caminho e é o que permite o backend confirmar que o QR não foi forjado.
  function handleScanDetect(rawValue: string) {
    const [scannedCode, scannedToken] = rawValue.split(".");
    if (!scannedCode) return;
    handleLookup(scannedCode, scannedToken);
  }

  // Etapa 2: só aqui o ingresso é de fato validado (e marcado como
  // utilizado, se válido).
  async function handleConfirmValidate() {
    if (!resolvedEvent) return;

    setSubmitting(true);

    try {
      const response = await validateTicket({ eventId: resolvedEvent.id, code, token });
      setResult(response);
      setResolvedEvent(null);
      setCode("");
      setToken(undefined);
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
    setToken(undefined);
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
          <Link href="/" className="cursor-pointer font-heading text-lg font-bold">
            Cine<span className="text-accent-lime">Verzel</span>
          </Link>
          <span className="text-xs font-medium text-text-mute">Portaria</span>
        </div>
        <button type="button" onClick={handleLogout} className="cursor-pointer text-sm text-text-dim hover:text-foreground">
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

            <button
              type="button"
              onClick={handleConfirmValidate}
              disabled={submitting}
              className="mb-2.5 w-full cursor-pointer rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Validando..." : "Validar ingresso"}
            </button>
            <button
              type="button"
              onClick={handleCancelLookup}
              disabled={submitting}
              className="w-full cursor-pointer text-center text-sm text-text-dim hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ler outro código
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setInputMode("scan")}
                className={`flex-1 cursor-pointer rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition-colors ${
                  inputMode === "scan"
                    ? "bg-accent-lime text-[#05070a]"
                    : "border border-border bg-surface text-text-dim hover:border-text-mute"
                }`}
              >
                Escanear código
              </button>
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`flex-1 cursor-pointer rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition-colors ${
                  inputMode === "manual"
                    ? "bg-accent-lime text-[#05070a]"
                    : "border border-border bg-surface text-text-dim hover:border-text-mute"
                }`}
              >
                Digitar código
              </button>
            </div>

            {inputMode === "scan" ? (
              <QrCodeScanner onDetect={handleScanDetect} paused={submitting} />
            ) : (
              <GateValidationForm
                code={code}
                onCodeChange={setCode}
                submitting={submitting}
                onSubmit={handleLookup}
                inputRef={inputRef}
                submitLabel="Buscar sessão"
                submittingLabel="Buscando..."
              />
            )}
          </>
        )}

        {result && <ValidationResult response={result} />}
      </div>
    </main>
  );
}
