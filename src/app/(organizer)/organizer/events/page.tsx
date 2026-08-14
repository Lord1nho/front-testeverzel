"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { appRoutes } from "@/config/routes";
import { useToast } from "@/components/toast/ToastProvider";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import { logout } from "@/services/auth";
import { listEvents } from "@/services/events";
import { listPublishedEvents } from "@/services/public-events";
import type { EventSummary } from "@/types/event";

function getStatusLabel(
  event: EventSummary,
): "Publicado" | "Rascunho" | "Em andamento" | "Encerrado" | "Cancelado" {
  if (event.status === "CANCELLED") return "Cancelado";
  if (event.status === "DRAFT") return "Rascunho";
  if (event.sessionStatus === "STARTED") return "Em andamento";
  if (event.sessionStatus === "ENDED") return "Encerrado";
  return "Publicado";
}

const statusClassName: Record<string, string> = {
  Publicado: "bg-accent-green text-[#05070a]",
  Rascunho: "bg-surface-2 text-foreground",
  "Em andamento": "bg-accent-cyan text-[#05070a]",
  Encerrado: "border border-border text-text-mute",
  Cancelado: "border border-red-500/30 text-red-400",
};

type Tab = "mine" | "all";

export default function OrganizerEventsPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("mine");
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Não precisa ser estado (não afeta o que é renderizado diretamente) —
  // só marca se algum carregamento já teve sucesso antes, pra decidir se
  // um erro de troca de aba trava a tela ou só avisa com um toast.
  const hasLoadedOnceRef = useRef(false);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  useEffect(() => {
    const request = tab === "mine" ? listEvents() : listPublishedEvents();
    request
      .then((data) => {
        setEvents(data.events);
        setNow(Date.now());
        setError(null);
        hasLoadedOnceRef.current = true;
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Não foi possível carregar os eventos.";
        if (hasLoadedOnceRef.current) {
          toast.error(message);
        } else {
          setError(message);
        }
      });
  }, [tab, toast]);

  return (
    <main className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
        <div className="flex flex-wrap items-center gap-4 sm:gap-9">
          <Link href="/" className="cursor-pointer font-heading text-xl font-bold tracking-tight sm:text-2xl">
            Cine<span className="text-accent-lime">Verzel</span>
          </Link>
          <nav className="flex items-center gap-7 text-sm text-text-dim">
            <span className="font-semibold text-foreground">Organizador</span>
            <span>Relatórios</span>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={appRoutes.profile}
            className="rounded-[9px] border border-border px-4 py-2 font-semibold text-foreground hover:border-text-mute"
          >
            Perfil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer rounded-[9px] px-4 py-2 font-semibold text-text-dim hover:text-foreground"
          >
            Sair
          </button>
          <Link
            href={appRoutes.organizerEventNew}
            className="rounded-[9px] bg-accent-lime px-4 py-2 font-bold text-[#05070a] hover:brightness-95"
          >
            + Novo evento
          </Link>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <h1 className="mb-5 font-heading text-2xl font-bold">Meus eventos</h1>

        <div className="mb-6 flex gap-2.5">
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`cursor-pointer rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition-colors ${
              tab === "mine"
                ? "bg-accent-lime text-[#05070a]"
                : "border border-border bg-surface text-text-dim hover:border-text-mute"
            }`}
          >
            Meus eventos
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`cursor-pointer rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition-colors ${
              tab === "all"
                ? "bg-accent-lime text-[#05070a]"
                : "border border-border bg-surface text-text-dim hover:border-text-mute"
            }`}
          >
            Todos os eventos
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {!events && !error && (
          <p className="text-sm text-text-dim">Carregando eventos...</p>
        )}

        {events && now !== null && (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.8fr_1.4fr_1.3fr_0.9fr_0.9fr_1fr_0.8fr] gap-2 border-b border-border bg-surface px-5 py-3.5 text-xs font-semibold text-text-mute">
                <span>Evento</span>
                <span>Data</span>
                <span>Cinema / Sala</span>
                <span>Capacidade</span>
                <span>Preço</span>
                <span>Status</span>
                <span />
              </div>

              {events.map((event) => {
                const statusLabel = getStatusLabel(event);
                const editable = new Date(event.startsAt).getTime() > now;

                return (
                  <div
                    key={event.id}
                    className={`grid grid-cols-[1.8fr_1.4fr_1.3fr_0.9fr_0.9fr_1fr_0.8fr] items-center gap-2 border-b border-border px-5 py-4 text-sm last:border-b-0 ${
                      editable ? "" : "opacity-55"
                    }`}
                  >
                    <span className="font-semibold">{event.title}</span>
                    <span className="text-text-dim">
                      {formatEventDateTime(event.startsAt)}
                    </span>
                    <span className="text-text-dim">
                      {venueLabels[event.venue]} · Sala {event.room}
                    </span>
                    <span className="text-text-dim">
                      {event.seatsAvailable} / {event.capacity}
                    </span>
                    <span className="text-text-dim">
                      {formatCurrency(event.price)}
                    </span>
                    <span
                      className={`w-fit rounded-md px-2.5 py-1 text-xs font-bold ${statusClassName[statusLabel]}`}
                    >
                      {statusLabel}
                    </span>
                    {tab === "all" ? (
                      <Link
                        href={appRoutes.checkout(event.id)}
                        className="text-sm font-semibold text-accent-cyan hover:text-accent-lime"
                      >
                        Ver
                      </Link>
                    ) : editable ? (
                      <Link
                        href={appRoutes.organizerEventDetails(event.id)}
                        className="text-sm font-semibold text-accent-cyan hover:text-accent-lime"
                      >
                        Editar
                      </Link>
                    ) : (
                      <span className="text-sm text-text-mute">—</span>
                    )}
                  </div>
                );
              })}

              {events.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-text-dim">
                  Nenhum evento criado ainda.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
