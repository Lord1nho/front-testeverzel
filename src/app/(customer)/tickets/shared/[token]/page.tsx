"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { QrTicket } from "@/features/tickets/QrTicket";
import { TicketDetailCard } from "@/features/tickets/TicketDetailCard";
import { ApiError } from "@/lib/api-client";
import { getPublicTicket } from "@/services/public-tickets";
import type { TicketDetail } from "@/types/ticket";

export default function SharedTicketPage() {
  const params = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicTicket(params.token)
      .then((data) => setTicket(data.ticket))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(
          err instanceof ApiError ? err.message : "Não foi possível carregar o ingresso.",
        );
      });
  }, [params.token]);

  if (notFound) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Link inválido ou expirado.</p>
        <Link href={appRoutes.events} className="text-sm text-accent-cyan hover:text-accent-lime">
          Ver eventos
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Link href={appRoutes.events} className="text-sm text-accent-cyan hover:text-accent-lime">
          Ver eventos
        </Link>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando ingresso...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-16">
      <div className="w-full max-w-md">
        <span className="mb-8 block font-heading text-lg font-bold">
          Cine<span className="text-accent-lime">Verzel</span>
        </span>

        <div className="mb-5">
          <QrTicket qrValue={ticket.qrValue} />
        </div>

        <TicketDetailCard ticket={ticket} />
      </div>
    </main>
  );
}
