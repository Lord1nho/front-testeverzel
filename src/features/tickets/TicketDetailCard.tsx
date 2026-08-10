import type { ReactNode } from "react";
import { formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import type { TicketDetail } from "@/types/ticket";

const statusConfig: Record<TicketDetail["status"], { label: string; className: string }> = {
  VALID: { label: "Confirmado", className: "bg-accent-green text-[#05070a]" },
  USED: { label: "Utilizado", className: "border border-border text-text-mute" },
  CANCELLED: { label: "Cancelado", className: "border border-red-500/30 text-red-400" },
};

interface TicketDetailCardProps {
  ticket: TicketDetail;
  actions?: ReactNode;
}

export function TicketDetailCard({ ticket, actions }: TicketDetailCardProps) {
  const status = statusConfig[ticket.status];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <span
        className={`mb-4 inline-block w-fit rounded-md px-2.5 py-1 text-xs font-bold ${status.className}`}
      >
        {status.label}
      </span>
      <h1 className="mb-1 font-heading text-xl font-bold">{ticket.event.title}</h1>
      <p className="mb-5 text-sm text-text-dim">
        {formatEventDateTime(ticket.event.startsAt)} · {venueLabels[ticket.event.venue]} · Sala{" "}
        {ticket.event.room}
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3.5">
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <span className="block text-sm font-bold">{ticket.seat.code}</span>
          <span className="text-xs text-text-mute">Assento</span>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <span className="block text-sm font-bold">{ticket.code}</span>
          <span className="text-xs text-text-mute">Código do ingresso</span>
        </div>
      </div>

      {actions}
    </div>
  );
}
