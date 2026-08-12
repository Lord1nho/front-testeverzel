"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { appRoutes } from "@/config/routes";
import { EventHero } from "@/features/events/EventHero";
import { ApiError } from "@/lib/api-client";
import { groupEventsByMovie } from "@/lib/group-events";
import { getMe, logout } from "@/services/auth";
import { listPublishedEvents } from "@/services/public-events";
import type { EventSummary } from "@/types/event";

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  useEffect(() => {
    listPublishedEvents()
      .then((data) => setEvents(data.events))
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Não foi possível carregar os eventos.",
        );
      });
  }, []);

  useEffect(() => {
    getMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const movieGroups = useMemo(() => {
    if (!events) return null;
    return groupEventsByMovie(events);
  }, [events]);

  const heroEvent = movieGroups && movieGroups.length > 0 ? movieGroups[0].sessions[0] : null;

  return (
    <main className="min-h-dvh">
      <div className="flex items-center justify-between border-b border-border px-10 py-5">
        <div className="flex items-center gap-9">
          <span className="font-heading text-lg font-bold">
            Cine<span className="text-accent-lime">Verzel</span>
          </span>
          <nav className="text-sm text-text-dim">
            <span className="text-foreground">Filmes</span>
          </nav>
        </div>
        <div className="flex items-center gap-5 text-sm">
          {isAuthenticated === true && (
            <>
              <Link href={appRoutes.profile} className="text-text-dim hover:text-foreground">
                Perfil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-text-dim hover:text-foreground"
              >
                Sair
              </button>
            </>
          )}
          {isAuthenticated === false && (
            <Link href={appRoutes.login} className="text-text-dim hover:text-foreground">
              Fazer login
            </Link>
          )}
        </div>
      </div>

      {heroEvent && <EventHero event={heroEvent} />}

      <div className="px-10 py-10">
        <h2 className="mb-6 font-heading text-2xl font-bold">Em cartaz</h2>

        {error && (
          <p className="rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {!movieGroups && !error && (
          <p className="text-sm text-text-dim">Carregando eventos...</p>
        )}

        {movieGroups && movieGroups.length === 0 && (
          <p className="rounded-xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-dim">
            Nenhum evento publicado no momento.
          </p>
        )}

        {movieGroups && movieGroups.length > 0 && (
          <div className="grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-4">
            {movieGroups.map((group) => (
              <MovieCard key={group.catalogItem.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
