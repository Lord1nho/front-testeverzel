import Image from "next/image";
import type { ReactNode } from "react";
import { formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import type { TicketDetail } from "@/types/ticket";

const statusConfig: Record<TicketDetail["status"], { label: string; className: string }> = {
  VALID: { label: "Válido", className: "bg-accent-green text-[#05070a]" },
  USED: { label: "Utilizado", className: "border border-border text-text-mute" },
  CANCELLED: { label: "Cancelado", className: "border border-red-500/30 text-red-400" },
};

interface TicketDetailCardProps {
  ticket: TicketDetail;
  posterUrl?: string | null;
  actions?: ReactNode;
}

export function TicketDetailCard({ ticket, posterUrl, actions }: TicketDetailCardProps) {
  const status = statusConfig[ticket.status];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-5 flex gap-4">
        {posterUrl && (
          <div className="relative h-[120px] w-[80px] flex-none overflow-hidden rounded-xl bg-surface-2">
            <Image
              src={posterUrl}
              alt={ticket.event.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <span
            className={`mb-2 inline-block w-fit rounded-md px-2.5 py-1 text-xs font-bold ${status.className}`}
          >
            {status.label}
          </span>
          <h1 className="font-heading text-xl font-bold">{ticket.event.title}</h1>
          <p className="text-sm text-text-dim">
            {formatEventDateTime(ticket.event.startsAt)} · {venueLabels[ticket.event.venue]} ·
            Sala {ticket.event.room}
          </p>
        </div>
      </div>

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
