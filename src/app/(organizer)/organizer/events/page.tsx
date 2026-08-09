"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatEventDate } from "@/lib/format";
import { logout } from "@/services/auth";
import { listEvents } from "@/services/events";
import type { EventSummary } from "@/types/event";

function getStatusLabel(
  event: EventSummary,
  now: number,
): "Publicado" | "Rascunho" | "Encerrado" | "Cancelado" {
  if (event.status === "CANCELLED") return "Cancelado";
  if (event.status === "DRAFT") return "Rascunho";
  return new Date(event.startsAt).getTime() < now ? "Encerrado" : "Publicado";
}

const statusClassName: Record<string, string> = {
  Publicado: "bg-accent-green text-[#05070a]",
  Rascunho: "bg-surface-2 text-foreground",
  Encerrado: "border border-border text-text-mute",
  Cancelado: "border border-red-500/30 text-red-400",
};

export default function OrganizerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  useEffect(() => {
    listEvents()
      .then((data) => {
        setEvents(data.events);
        setNow(Date.now());
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Não foi possível carregar os eventos.",
        );
      });
  }, []);

  return (
    <main className="min-h-dvh px-10 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-9">
          <span className="font-heading text-lg font-bold">
            Cine<span className="text-accent-lime">Verzel</span>{" "}
            <span className="text-xs font-medium text-text-mute">
              Organizador
            </span>
          </span>
          <nav className="flex gap-7 text-sm text-text-dim">
            <span className="text-foreground">Meus eventos</span>
            <span>Relatórios</span>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href={appRoutes.profile}
            className="text-sm text-text-dim hover:text-foreground"
          >
            Perfil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-text-dim hover:text-foreground"
          >
            Sair
          </button>
          <Link
            href={appRoutes.organizerEventNew}
            className="rounded-lg bg-accent-lime px-4.5 py-2.5 text-sm font-bold text-[#05070a] hover:brightness-95"
          >
            + Novo evento
          </Link>
        </div>
      </div>

      <h1 className="mb-5 font-heading text-2xl font-bold">Meus eventos</h1>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {!events && !error && (
        <p className="text-sm text-text-dim">Carregando eventos...</p>
      )}

      {events && now !== null && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr_1fr_0.8fr] gap-2 border-b border-border bg-surface px-5 py-3.5 text-xs font-semibold text-text-mute">
            <span>Evento</span>
            <span>Data</span>
            <span>Local</span>
            <span>Capacidade</span>
            <span>Preço</span>
            <span>Status</span>
            <span />
          </div>

          {events.map((event) => {
            const statusLabel = getStatusLabel(event, now);
            const editable = new Date(event.startsAt).getTime() > now;

            return (
              <div
                key={event.id}
                className={`grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-b border-border px-5 py-4 text-sm last:border-b-0 ${
                  editable ? "" : "opacity-55"
                }`}
              >
                <span className="font-semibold">{event.title}</span>
                <span className="text-text-dim">
                  {formatEventDate(event.startsAt)}
                </span>
                <span className="text-text-dim">{event.location}</span>
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
                {editable ? (
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
      )}
    </main>
  );
}
