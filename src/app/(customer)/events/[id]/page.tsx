"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/config/routes";
import { SessionTimeButton } from "@/features/events/SessionTimeButton";
import { ApiError } from "@/lib/api-client";
import { formatEventTime, formatSessionDateParts } from "@/lib/format";
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
    <main className="min-h-dvh">
      <div className="relative h-[320px] w-full overflow-hidden bg-surface-2 sm:h-[420px]">
        {event.catalogItem.imageUrl && (
          <Image
            src={event.catalogItem.imageUrl}
            alt={event.catalogItem.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

        <Link
          href={appRoutes.events}
          className="absolute left-6 top-6 inline-block text-sm text-text-dim hover:text-foreground sm:left-10 sm:top-8"
        >
          ← Voltar para eventos
        </Link>

        <div className="absolute bottom-8 left-6 right-6 sm:bottom-11 sm:left-10 sm:right-10">
          <h1 className="mb-2 font-heading text-2xl font-bold leading-tight text-foreground sm:text-4xl">
            {event.catalogItem.title}
          </h1>
          <p className="text-sm text-text-dim">
            {event.catalogItem.durationMinutes
              ? `${event.catalogItem.durationMinutes} min`
              : "Duração não informada pela TMDB"}
          </p>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-3xl">
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
                const { weekday, dayMonth } = formatSessionDateParts(
                  dateGroup.venues[0].sessions[0].startsAt,
                );
                return (
                  <button
                    key={dateGroup.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(dateGroup.dateKey)}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-[9px] px-4 py-2 text-[13px] font-bold leading-tight transition-colors ${
                      isActive
                        ? "bg-accent-lime text-[#05070a]"
                        : "border border-border bg-surface text-text-dim hover:border-accent-lime hover:text-foreground"
                    }`}
                  >
                    <span>{weekday}</span>
                    <span>{dayMonth}</span>
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
