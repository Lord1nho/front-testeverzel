"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { appRoutes } from "@/config/routes";
import { apiClient, ApiError } from "@/lib/api-client";
import { formatCurrency, formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import { CheckoutSummary } from "@/features/checkout/CheckoutSummary";
import { PaymentForm } from "@/features/checkout/PaymentForm";
import { PaymentOutcome } from "@/features/checkout/PaymentOutcome";
import { SeatMap } from "@/features/checkout/SeatMap";
import { getMe } from "@/services/auth";
import { getEventSeats, getPublishedEvent } from "@/services/public-events";
import { createPayment } from "@/services/payments";
import { cancelReservation, createReservation } from "@/services/reservations";
import type { PublicEventDetail, Seat } from "@/types/event";
import type { CardInput, PaymentResult } from "@/types/payment";
import type { Reservation } from "@/types/reservation";

const MAX_SEATS = 10;

type AuthState = "loading" | "guest" | "wrong-role" | "customer";

export default function CheckoutPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
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

  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [declineNotice, setDeclineNotice] = useState<{
    reason: string | null;
    attempt: number;
    maxAttempts: number;
  } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const loadSeats = useCallback(() => {
    return getEventSeats(eventId).then((data) => setSeats(data.seats));
  }, [eventId]);

  // Libera a reserva se a pessoa sair da tela de pagamento sem passar pelos
  // botões explícitos (ex.: voltar/avançar do navegador). A ref é atualizada
  // a cada render pra sempre refletir a reserva atual; o efeito abaixo roda
  // só no unmount de verdade (deps vazias) — se `reservation` entrasse nas
  // deps, o cleanup dispararia a cada troca de reserva, não só ao sair.
  const pendingReservationIdRef = useRef<string | null>(null);

  useEffect(() => {
    pendingReservationIdRef.current =
      reservation && !paymentResult && !cancelled ? reservation.id : null;
  }, [reservation, paymentResult, cancelled]);

  useEffect(() => {
    return () => {
      const id = pendingReservationIdRef.current;
      if (id) apiClient.postBeacon(`/api/reservations/${id}/cancel`);
    };
  }, []);

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

  async function handlePay(card: CardInput) {
    if (!reservation) return;

    setPaying(true);
    setPaymentError(null);
    setSessionExpired(false);
    setDeclineNotice(null);

    try {
      const result = await createPayment({ reservationId: reservation.id, card });

      // Recusado mas ainda com tentativa sobrando (até 3 por reserva, regra
      // do backend): a reserva continua PENDING_PAYMENT e o assento continua
      // RESERVED, então a pessoa fica na mesma tela de pagamento e tenta de
      // novo. Só sai daqui pra tela de resultado quando o backend fecha a
      // reserva (aprovado, ou recusa na 3ª/última tentativa).
      if (result.reservationStatus === "PENDING_PAYMENT") {
        setDeclineNotice({
          reason: result.payment.failureReason,
          attempt: result.attempt,
          maxAttempts: result.maxAttempts,
        });
        return;
      }

      setPaymentResult(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSessionExpired(true);
        setPaymentError("Sua sessão expirou. Entre novamente para continuar.");
      } else if (err instanceof ApiError && err.status === 409) {
        setPaymentError(
          "Essa reserva já está sendo processada ou já foi concluída. Atualize a página para conferir o status.",
        );
      } else {
        setPaymentError(
          err instanceof ApiError ? err.message : "Não foi possível processar o pagamento.",
        );
      }
    } finally {
      setPaying(false);
    }
  }

  async function handleCancel() {
    if (!reservation) return;

    setCancelling(true);
    setPaymentError(null);
    try {
      await cancelReservation(reservation.id);
      setCancelled(true);
    } catch (err) {
      setPaymentError(
        err instanceof ApiError ? err.message : "Não foi possível cancelar a reserva.",
      );
    } finally {
      setCancelling(false);
    }
  }

  async function handleBackFromPayment() {
    if (reservation) {
      await cancelReservation(reservation.id).catch(() => {});
    }
    // Não zera `reservation` aqui — faria a tela renderizar de volta a
    // seleção de assentos por um instante antes da navegação terminar. O
    // cleanup do useEffect acima ainda vai disparar um cancelamento pra
    // essa mesma reserva quando a página desmontar, mas é um 400 inofensivo
    // (reserva já cancelada), sem efeito visível.
    router.push(appRoutes.eventDetails(eventId));
  }

  function resetToSelection() {
    setReservation(null);
    setPaymentResult(null);
    setPaymentError(null);
    setDeclineNotice(null);
    setSessionExpired(false);
    setCancelled(false);
    setSelectedIds([]);
    loadSeats().catch(() => {});
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

  if (reservation && cancelled) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center">
          <h1 className="mb-2 font-heading text-xl font-bold">Reserva cancelada</h1>
          <p className="mb-6 text-sm text-text-dim">
            Seus assentos foram liberados e já estão disponíveis para outros clientes.
          </p>
          <Link
            href={appRoutes.eventDetails(event.id)}
            className="block w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95"
          >
            Voltar para o evento
          </Link>
        </div>
      </main>
    );
  }

  if (reservation && paymentResult) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 py-16">
        <PaymentOutcome
          payment={paymentResult.payment}
          tickets={paymentResult.tickets}
          eventTitle={reservation.event.title}
          onRetry={resetToSelection}
        />
      </main>
    );
  }

  if (reservation) {
    return (
      <main className="min-h-dvh px-10 py-10">
        <button
          type="button"
          onClick={handleBackFromPayment}
          className="mb-8 inline-block text-sm text-text-dim hover:text-foreground"
        >
          ← Voltar para o evento
        </button>

        <h1 className="mb-1 font-heading text-2xl font-bold">Pagamento</h1>
        <p className="mb-8 text-sm text-text-dim">
          Confirme os dados do cartão para emitir seu ingresso.
        </p>

        {sessionExpired && (
          <p className="mb-6 max-w-xl rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            Sua sessão expirou.{" "}
            <Link href={appRoutes.login} className="font-semibold text-accent-cyan hover:text-accent-lime">
              Entrar novamente
            </Link>
          </p>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          <PaymentForm
            totalAmount={reservation.totalAmount}
            submitting={paying}
            error={
              paymentError ??
              (declineNotice
                ? `${declineNotice.reason ?? "Cartão recusado."} Tentativa ${declineNotice.attempt} de ${declineNotice.maxAttempts} — você ainda pode tentar com outro cartão.`
                : null)
            }
            onSubmit={handlePay}
          />

          <div className="w-80 flex-none self-start rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 font-heading text-base font-semibold">Resumo do pedido</h3>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-text-mute">Evento</span>
              <span className="font-semibold">{reservation.event.title}</span>
            </div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-text-mute">Assentos</span>
              <span className="font-semibold">
                {reservation.seats.map((seat) => seat.code).join(", ")}
              </span>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-text-mute">Total</span>
              <span className="font-semibold text-accent-lime">
                {formatCurrency(reservation.totalAmount)}
              </span>
            </div>
            <div className="mb-4 h-px bg-border" />
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-sm text-text-dim hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelling ? "Cancelando..." : "Cancelar reserva"}
            </button>
          </div>
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
