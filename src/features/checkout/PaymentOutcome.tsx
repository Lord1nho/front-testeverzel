import Link from "next/link";
import { appRoutes } from "@/config/routes";
import type { Payment, PaymentIssuedTicket } from "@/types/payment";

interface PaymentOutcomeProps {
  payment: Payment;
  tickets: PaymentIssuedTicket[];
  eventTitle: string;
  onRetry: () => void;
}

export function PaymentOutcome({ payment, tickets, eventTitle, onRetry }: PaymentOutcomeProps) {
  const approved = payment.status === "APPROVED";

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center">
      <span
        className={`mb-4 inline-block rounded-md px-3 py-1 text-xs font-bold ${
          approved
            ? "bg-accent-green text-[#05070a]"
            : "border border-red-500/30 text-red-400"
        }`}
      >
        {approved ? "Pagamento aprovado" : "Pagamento recusado"}
      </span>
      <h1 className="mb-2 font-heading text-xl font-bold">
        {approved ? "Ingresso emitido!" : "Não foi possível concluir o pagamento"}
      </h1>
      <p className="mb-6 text-sm text-text-dim">
        {approved
          ? `Seu ingresso para ${eventTitle} já está disponível em Meus ingressos.`
          : `${payment.failureReason ?? "O pagamento foi recusado."} Essa reserva usou as 3 tentativas permitidas e foi encerrada — os assentos já foram liberados.`}
      </p>

      {approved && tickets.length > 0 && (
        <div className="mb-6 flex flex-col gap-2 text-left">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={appRoutes.ticketDetails(ticket.id)}
              className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm hover:border-accent-cyan"
            >
              <span className="font-semibold">{ticket.code}</span>
              <span className="text-accent-cyan">Ver ingresso →</span>
            </Link>
          ))}
        </div>
      )}

      {approved ? (
        <Link
          href={appRoutes.myTickets}
          className="block w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95"
        >
          Ver meus ingressos
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="block w-full cursor-pointer rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95"
        >
          Escolher assentos novamente
        </button>
      )}
    </div>
  );
}
