"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TicketCard } from "@/components/TicketCard";
import { appRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { getMe, logout } from "@/services/auth";
import { getPublishedEvent } from "@/services/public-events";
import { listTickets } from "@/services/tickets";
import type { TicketSummary } from "@/types/ticket";

type AuthState = "loading" | "guest" | "wrong-role" | "customer";
type Tab = "upcoming" | "past";

export default function MyTicketsPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [now] = useState(() => Date.now());
  const [posters, setPosters] = useState<Record<string, string | null>>({});

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        if (user.role !== "CUSTOMER") {
          setAuthState("wrong-role");
          return;
        }
        setAuthState("customer");
        listTickets()
          .then((data) => setTickets(data.tickets))
          .catch((err) => {
            setError(
              err instanceof ApiError
                ? err.message
                : "Não foi possível carregar seus ingressos.",
            );
          });
      })
      .catch(() => {
        router.replace(appRoutes.login);
      });
  }, [router]);

  useEffect(() => {
    if (!tickets || tickets.length === 0) return;

    const eventIds = Array.from(new Set(tickets.map((ticket) => ticket.event.id)));
    Promise.allSettled(eventIds.map((id) => getPublishedEvent(id))).then((results) => {
      const next: Record<string, string | null> = {};
      results.forEach((result, index) => {
        next[eventIds[index]] =
          result.status === "fulfilled" ? result.value.event.catalogItem.imageUrl : null;
      });
      setPosters(next);
    });
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return null;
    return tickets.filter((ticket) => {
      const isUpcoming = new Date(ticket.event.startsAt).getTime() >= now;
      return tab === "upcoming" ? isUpcoming : !isUpcoming;
    });
  }, [tickets, tab, now]);

  if (authState === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando...</p>
      </main>
    );
  }

  if (authState === "wrong-role") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Acesso restrito a clientes.</p>
        <Link href={appRoutes.profile} className="text-sm text-accent-cyan hover:text-accent-lime">
          Voltar ao perfil
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
        <div className="flex flex-wrap items-center gap-4 sm:gap-9">
          <Link href="/" className="cursor-pointer font-heading text-xl font-bold tracking-tight sm:text-2xl">
            Cine<span className="text-accent-lime">Verzel</span>
          </Link>
          <nav className="text-sm text-text-dim">
            <span className="font-semibold text-foreground">Meus ingressos</span>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={appRoutes.events}
            className="cursor-pointer rounded-[9px] border border-border bg-surface-2 px-4 py-2 font-semibold text-foreground shadow-sm shadow-black/30 transition-colors hover:border-text-mute hover:bg-border"
          >
            Eventos
          </Link>
          <Link
            href={appRoutes.profile}
            className="cursor-pointer rounded-[9px] border border-border bg-surface-2 px-4 py-2 font-semibold text-foreground shadow-sm shadow-black/30 transition-colors hover:border-text-mute hover:bg-border"
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
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <h1 className="mb-6 font-heading text-2xl font-bold">Meus ingressos</h1>

        <div className="mb-7 flex gap-2.5">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`cursor-pointer rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition-colors ${
              tab === "upcoming"
                ? "bg-accent-lime text-[#05070a]"
                : "border border-border bg-surface text-text-dim hover:border-text-mute"
            }`}
          >
            Próximos
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`cursor-pointer rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition-colors ${
              tab === "past"
                ? "bg-accent-lime text-[#05070a]"
                : "border border-border bg-surface text-text-dim hover:border-text-mute"
            }`}
          >
            Anteriores
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {!filteredTickets && !error && (
          <p className="text-sm text-text-dim">Carregando ingressos...</p>
        )}

        {filteredTickets && filteredTickets.length === 0 && (
          <p className="rounded-xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-dim">
            Nenhum ingresso {tab === "upcoming" ? "próximo" : "anterior"} encontrado.
          </p>
        )}

        {filteredTickets && filteredTickets.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                posterUrl={posters[ticket.event.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
