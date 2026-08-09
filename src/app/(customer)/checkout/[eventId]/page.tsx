"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import { CheckoutSummary } from "@/features/checkout/CheckoutSummary";
import { SeatMap } from "@/features/checkout/SeatMap";
import { getMe } from "@/services/auth";
import { getEventSeats, getPublishedEvent } from "@/services/public-events";
import { createReservation } from "@/services/reservations";
import type { PublicEventDetail, Seat } from "@/types/event";
import type { Reservation } from "@/types/reservation";

const MAX_SEATS = 10;

type AuthState = "loading" | "guest" | "wrong-role" | "customer";

export default function CheckoutPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [event, setEvent] = useState<PublicEventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  const loadSeats = useCallback(() => {
    return getEventSeats(eventId).then((data) => setSeats(data.seats));
  }, [eventId]);

  useEffect(() => {
    getMe()
      .then(({ user }) => setAuthState(user.role === "CUSTOMER" ? "customer" : "wrong-role"))
      .catch(() => setAuthState("guest"));
  }, []);

  useEffect(() => {
    getPublishedEvent(eventId)
      .then((data) => setEvent(data.event))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setLoadError(
          err instanceof ApiError ? err.message : "Não foi possível carregar o evento.",
        );
      });

    loadSeats().catch((err) => {
      setLoadError(
        err instanceof ApiError ? err.message : "Não foi possível carregar o mapa de assentos.",
      );
    });
  }, [eventId, loadSeats]);

  function toggleSeat(seat: Seat) {
    if (seat.status !== "AVAILABLE") return;
    setSubmitError(null);
    setSelectedIds((current) => {
      if (current.includes(seat.id)) {
        return current.filter((id) => id !== seat.id);
      }
      if (current.length >= MAX_SEATS) return current;
      return [...current, seat.id];
    });
  }

  async function handleConfirm() {
    if (authState !== "customer" || !event || selectedIds.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { reservation: created } = await createReservation({
        eventId: event.id,
        seatIds: selectedIds,
      });
      setReservation(created);
      setSelectedIds([]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthState("guest");
        setSubmitError("Sua sessão expirou. Entre novamente para continuar.");
      } else if (err instanceof ApiError && err.status === 409) {
        setSubmitError(
          "Alguns assentos escolhidos não estão mais disponíveis. Selecione novamente.",
        );
        setSelectedIds([]);
        loadSeats().catch(() => {});
      } else {
        setSubmitError(
          err instanceof ApiError ? err.message : "Não foi possível concluir a reserva.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

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

  if (loadError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-400">{loadError}</p>
        <Link href={appRoutes.events} className="text-sm text-accent-cyan hover:text-accent-lime">
          ← Voltar para eventos
        </Link>
      </main>
    );
  }

  if (!event || !seats) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando reserva...</p>
      </main>
    );
  }

  if (reservation) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center">
          <span className="mb-4 inline-block rounded-md bg-accent-cyan px-3 py-1 text-xs font-bold text-[#05070a]">
            Aguardando pagamento
          </span>
          <h1 className="mb-2 font-heading text-xl font-bold">Reserva confirmada</h1>
          <p className="mb-6 text-sm text-text-dim">
            Seus assentos ficam bloqueados para você. O pagamento ainda não está
            disponível nesta versão — assim que ele for liberado, você poderá
            concluir a compra e emitir o ingresso.
          </p>

          <div className="mb-6 rounded-xl border border-border bg-surface-2 p-4 text-left text-sm">
            <div className="mb-2 flex justify-between">
              <span className="text-text-mute">Evento</span>
              <span className="font-semibold">{reservation.event.title}</span>
            </div>
            <div className="mb-2 flex justify-between">
              <span className="text-text-mute">Assentos</span>
              <span className="font-semibold">
                {reservation.seats.map((seat) => seat.code).join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-mute">Total</span>
              <span className="font-semibold text-accent-lime">
                {formatCurrency(reservation.totalAmount)}
              </span>
            </div>
          </div>

          <Link
            href={appRoutes.events}
            className="block w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95"
          >
            Voltar para eventos
          </Link>
        </div>
      </main>
    );
  }

  const soldOut = event.seatsAvailable <= 0;
  const eventUnavailable = event.sessionStatus !== "SCHEDULED";
  const blockedReason =
    authState === "loading"
      ? "Carregando..."
      : authState === "wrong-role"
      ? "Apenas clientes podem reservar ingressos."
      : eventUnavailable
        ? "Este evento não está mais disponível para reserva."
        : soldOut
          ? "Ingressos esgotados para este evento."
          : null;

  const selectedSeats = seats.filter((seat) => selectedIds.includes(seat.id));

  return (
    <main className="min-h-dvh px-10 py-10">
      <Link
        href={appRoutes.eventDetails(event.id)}
        className="mb-8 inline-block text-sm text-text-dim hover:text-foreground"
      >
        ← Voltar para o evento
      </Link>

      <h1 className="mb-1 font-heading text-2xl font-bold">Escolha seus assentos</h1>
      <p className="mb-8 text-sm text-text-dim">
        Selecione até {MAX_SEATS} assentos disponíveis no mapa abaixo.
      </p>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 rounded-2xl border border-border bg-surface p-8">
          <SeatMap
            seats={seats}
            selectedIds={selectedIds}
            onToggle={toggleSeat}
            maxSelectable={MAX_SEATS}
          />
        </div>

        <CheckoutSummary
          eventTitle={event.title}
          eventDateTime={formatEventDateTime(event.startsAt)}
          venueLabel={venueLabels[event.venue]}
          room={event.room}
          selectedSeats={selectedSeats}
          pricePerSeat={event.price}
          error={submitError}
          submitting={submitting}
          loginHref={authState === "guest" ? appRoutes.login : undefined}
          blockedReason={authState !== "guest" ? blockedReason : null}
          onConfirm={handleConfirm}
        />
      </div>
    </main>
  );
}
