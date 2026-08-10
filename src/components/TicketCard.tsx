import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import type { TicketSummary } from "@/types/ticket";

const statusConfig: Record<TicketSummary["status"], { label: string; className: string }> = {
  VALID: { label: "✓ Confirmado", className: "text-accent-green" },
  USED: { label: "Utilizado", className: "text-text-mute" },
  CANCELLED: { label: "Cancelado", className: "text-red-400" },
};

export function TicketCard({ ticket }: { ticket: TicketSummary }) {
  const status = statusConfig[ticket.status];

  return (
    <Link
      href={appRoutes.ticketDetails(ticket.id)}
      className="flex gap-5 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent-cyan"
    >
      <div className="flex h-[126px] w-[88px] flex-none items-center justify-center rounded-xl bg-surface-2 text-center text-[11px] text-text-mute">
        Sem imagem
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

      <div
        aria-hidden
        className="h-[70px] w-[70px] flex-none self-center rounded-lg"
        style={{
          background:
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0 4px, var(--surface-2) 4px 8px)",
        }}
      />
    </Link>
  );
}
