"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { useToast } from "@/components/toast/ToastProvider";
import { QrTicket } from "@/features/tickets/QrTicket";
import { TicketDetailCard } from "@/features/tickets/TicketDetailCard";
import { ApiError } from "@/lib/api-client";
import { getMe } from "@/services/auth";
import { getPublishedEvent } from "@/services/public-events";
import { getTicket, shareTicket } from "@/services/tickets";
import type { TicketDetail } from "@/types/ticket";

type AuthState = "loading" | "guest" | "wrong-role" | "customer";

export default function TicketDetailsPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const toast = useToast();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    getMe()
      .then(({ user }) => setAuthState(user.role === "CUSTOMER" ? "customer" : "wrong-role"))
      .catch(() => router.replace(appRoutes.login));
  }, [router]);

  useEffect(() => {
    getTicket(params.ticketId)
      .then((data) => {
        setTicket(data.ticket);
        getPublishedEvent(data.ticket.event.id)
          .then((eventData) => setPosterUrl(eventData.event.catalogItem.imageUrl))
          .catch(() => {});
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(appRoutes.login);
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(
          err instanceof ApiError ? err.message : "Não foi possível carregar o ingresso.",
        );
      });
  }, [params.ticketId, router]);

  async function handleShare() {
    setSharing(true);
    try {
      const { shareLink: link } = await shareTicket(params.ticketId);
      setShareLink(`${window.location.origin}${appRoutes.sharedTicket(link.token)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível gerar o link.");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopy() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado!");
  }

  if (authState === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando...</p>
      </main>
    );
  }

  if (authState === "wrong-role") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Acesso restrito a clientes.</p>
        <Link href={appRoutes.profile} className="text-sm text-accent-cyan hover:text-accent-lime">
          Voltar ao perfil
        </Link>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">Ingresso não encontrado.</p>
        <Link
          href={appRoutes.myTickets}
          className="text-sm text-accent-cyan hover:text-accent-lime"
        >
          ← Voltar para meus ingressos
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Link
          href={appRoutes.myTickets}
          className="text-sm text-accent-cyan hover:text-accent-lime"
        >
          ← Voltar para meus ingressos
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
        <Link
          href={appRoutes.myTickets}
          className="mb-8 inline-block text-sm text-text-dim hover:text-foreground"
        >
          ← Voltar para meus ingressos
        </Link>

        <div className="mb-5">
          <QrTicket qrValue={ticket.qrValue} />
        </div>

        <TicketDetailCard
          ticket={ticket}
          posterUrl={posterUrl}
          actions={
            <div>
              {shareLink ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-[9px] border border-border bg-surface-2 px-3 py-2.5">
                    <span className="flex-1 truncate text-xs text-text-dim">{shareLink}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full cursor-pointer rounded-[10px] border border-border bg-surface-2 py-3 text-center text-sm font-semibold text-foreground hover:bg-border"
                  >
                    Copiar link
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className="w-full cursor-pointer rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sharing ? "Gerando link..." : "Compartilhar ingresso"}
                </button>
              )}
            </div>
          }
        />
      </div>
    </main>
  );
}
