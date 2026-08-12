import Image from "next/image";
import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import type { TicketSummary } from "@/types/ticket";

const statusConfig: Record<TicketSummary["status"], { label: string; className: string }> = {
  VALID: { label: "✓ Válido", className: "text-accent-green" },
  USED: { label: "Utilizado", className: "text-text-mute" },
  CANCELLED: { label: "Cancelado", className: "text-red-400" },
};

interface TicketCardProps {
  ticket: TicketSummary;
  posterUrl?: string | null;
}

export function TicketCard({ ticket, posterUrl }: TicketCardProps) {
  const status = statusConfig[ticket.status];

  return (
    <Link
      href={appRoutes.ticketDetails(ticket.id)}
      className="flex gap-5 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent-cyan"
    >
      <div className="relative h-[126px] w-[88px] flex-none overflow-hidden rounded-xl bg-surface-2">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={ticket.event.title}
            fill
            sizes="88px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-[11px] text-text-mute">
            Sem imagem
          </div>
        )}
      </div>

      <div className="flex-1">
        <span className="mb-1.5 block text-base font-semibold leading-tight">
          {ticket.event.title}
        </span>
        <span className="block text-xs text-text-dim">
          {venueLabels[ticket.event.venue]} · Sala {ticket.event.room}
        </span>
        <span className="mb-3 block text-xs text-text-dim">
          {formatEventDateTime(ticket.event.startsAt)} · Assento {ticket.seat.code}
        </span>
        <span className={`text-xs font-bold ${status.className}`}>{status.label}</span>
      </div>
    </Link>
  );
}
