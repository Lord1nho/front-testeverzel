"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/config/routes";
import { SessionTimeButton } from "@/features/events/SessionTimeButton";
import { ApiError } from "@/lib/api-client";
import { formatEventTime, formatSessionDateLabel } from "@/lib/format";
import { groupSessionsByDateAndVenue } from "@/lib/group-events";
import { venueLabels } from "@/lib/venue";
import { getPublishedEvent, listPublishedEvents } from "@/services/public-events";
import type { EventSummary, PublicEventDetail } from "@/types/event";

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<PublicEventDetail | null>(null);
  const [sessions, setSessions] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    getPublishedEvent(params.id)
      .then((data) => setEvent(data.event))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(
          err instanceof ApiError ? err.message : "Não foi possível carregar o evento.",
        );
      });

    listPublishedEvents()
      .then((data) => setSessions(data.events))
      .catch(() => {});
  }, [params.id]);

  const dateGroups = useMemo(() => {
    if (!event || !sessions) return [];
    const sameMovie = sessions.filter(
      (session) => session.catalogItem.id === event.catalogItem.id,
    );
    return groupSessionsByDateAndVenue(sameMovie);
  }, [event, sessions]);

  const activeDateGroup =
    dateGroups.find((group) => group.dateKey === selectedDateKey) ?? dateGroups[0];

  if (notFound) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Evento não encontrado.</p>
        <Link href={appRoutes.events} className="text-sm text-accent-cyan hover:text-accent-lime">
          ← Voltar para eventos
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Link href={appRoutes.events} className="text-sm text-accent-cyan hover:text-accent-lime">
          ← Voltar para eventos
        </Link>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando evento...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-10 py-10">
      <Link
        href={appRoutes.events}
        className="mb-8 inline-block text-sm text-text-dim hover:text-foreground"
      >
        ← Voltar para eventos
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full max-w-[280px] flex-none overflow-hidden rounded-xl border border-border bg-surface-2">
          <div className="relative aspect-[2/3] w-full">
            {event.catalogItem.imageUrl ? (
              <Image
                src={event.catalogItem.imageUrl}
                alt={event.catalogItem.title}
                fill
                sizes="280px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-text-mute">
                Sem imagem
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="mb-2 font-heading text-3xl font-bold">{event.catalogItem.title}</h1>
          <p className="mb-6 text-sm text-text-dim">
            {event.catalogItem.durationMinutes
              ? `${event.catalogItem.durationMinutes} min`
              : "Duração não informada pela TMDB"}
          </p>

          {event.catalogItem.description && (
            <p className="mb-8 max-w-xl text-sm leading-6 text-text-dim">
              {event.catalogItem.description}
            </p>
          )}

          <h3 className="mb-4 font-heading text-base font-semibold">
            Escolha data e sessão
          </h3>

          {!sessions && (
            <p className="text-sm text-text-dim">Carregando sessões...</p>
          )}

          {sessions && dateGroups.length === 0 && (
            <p className="max-w-xl rounded-xl border border-border bg-surface px-5 py-6 text-sm text-text-dim">
              Nenhuma sessão disponível para este filme no momento.
            </p>
          )}

          {dateGroups.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2.5">
              {dateGroups.map((dateGroup) => {
                const isActive = dateGroup.dateKey === activeDateGroup?.dateKey;
                return (
                  <button
                    key={dateGroup.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(dateGroup.dateKey)}
                    className={`rounded-[9px] px-4.5 py-2.5 text-[13px] font-bold transition-colors ${
                      isActive
                        ? "bg-accent-lime text-[#05070a]"
                        : "border border-border bg-surface text-text-dim hover:border-accent-cyan hover:text-foreground"
                    }`}
                  >
                    {formatSessionDateLabel(dateGroup.venues[0].sessions[0].startsAt)}
                  </button>
                );
              })}
            </div>
          )}

          {activeDateGroup && (
            <div className="flex max-w-xl flex-col gap-4">
              {activeDateGroup.venues.map((venueGroup) => (
                <div
                  key={venueGroup.venue}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <span className="mb-3 block text-sm font-semibold">
                    {venueLabels[venueGroup.venue]}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {venueGroup.sessions.map((session) => {
                      const soldOut = session.seatsAvailable <= 0;
                      const purchasable =
                        session.sessionStatus === "SCHEDULED" && !soldOut;

                      return (
                        <SessionTimeButton
                          key={session.id}
                          href={appRoutes.checkout(session.id)}
                          time={formatEventTime(session.startsAt)}
                          subLabel={`Sala ${session.room}`}
                          disabled={!purchasable}
                          disabledLabel={
                            soldOut ? "Esgotado" : formatEventTime(session.startsAt)
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
