import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Seat } from "@/types/event";

interface CheckoutSummaryProps {
  eventTitle: string;
  eventDateTime: string;
  venueLabel: string;
  room: number;
  selectedSeats: Seat[];
  pricePerSeat: number;
  submitting: boolean;
  loginHref?: string;
  blockedReason?: string | null;
  onConfirm: () => void;
}

export function CheckoutSummary({
  eventTitle,
  eventDateTime,
  venueLabel,
  room,
  selectedSeats,
  pricePerSeat,
  submitting,
  loginHref,
  blockedReason,
  onConfirm,
}: CheckoutSummaryProps) {
  const total = pricePerSeat * selectedSeats.length;
  const hasSelection = selectedSeats.length > 0;

  return (
    <div className="w-full self-start rounded-2xl border border-border bg-surface p-6 lg:w-80 lg:flex-none">
      <h3 className="mb-1.5 font-heading text-base font-semibold">{eventTitle}</h3>
      <span className="mb-4 block text-xs text-text-mute">
        {eventDateTime} · {venueLabel} · Sala {room}
      </span>

      <div className="mb-4 h-px bg-border" />

      <span className="mb-2 block text-xs font-semibold text-text-mute">
        Assentos selecionados
      </span>
      {hasSelection ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {selectedSeats.map((seat) => (
            <span
              key={seat.id}
              className="rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold"
            >
              {seat.code}
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-text-dim">
          Toque nos assentos disponíveis para selecioná-los.
        </p>
      )}

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-text-dim">
          {selectedSeats.length} × {formatCurrency(pricePerSeat)}
        </span>
        <span className="font-heading text-lg font-bold text-accent-lime">
          {formatCurrency(total)}
        </span>
      </div>

      <div className="mb-4 h-px bg-border" />

      {blockedReason && (
        <p className="mb-4 rounded-[9px] border border-border bg-surface-2 px-3 py-2 text-xs text-text-dim">
          {blockedReason}
        </p>
      )}

      {loginHref ? (
        <Link
          href={loginHref}
          className="block w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95"
        >
          Entrar para reservar
        </Link>
      ) : (
        <button
          type="button"
          disabled={!hasSelection || submitting || Boolean(blockedReason)}
          onClick={onConfirm}
          className="w-full cursor-pointer rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Reservando..." : "Confirmar reserva"}
        </button>
      )}
    </div>
  );
}
