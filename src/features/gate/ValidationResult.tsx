import { formatEventTime } from "@/lib/format";
import type { GateValidationResponse } from "@/types/gate";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l9 16H3L12 3z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface ValidationResultProps {
  response: GateValidationResponse;
}

export function ValidationResult({ response }: ValidationResultProps) {
  const { result, ticket, reason } = response;

  const valid = result === "VALID";

  const config = {
    VALID: { title: "Ingresso válido", icon: CheckIcon, iconClassName: "text-accent-green" },
    INVALID: { title: "Ingresso inválido", icon: XIcon, iconClassName: "text-text-mute" },
    ALREADY_USED: {
      title: "Ingresso já utilizado",
      icon: ClockIcon,
      iconClassName: "text-text-mute",
    },
    WRONG_EVENT: {
      title: "Ingresso de outro evento",
      icon: WarningIcon,
      iconClassName: "text-text-mute",
    },
  }[result];

  const Icon = config.icon;

  return (
    <div
      className={`rounded-2xl border bg-surface p-6 text-center ${
        valid ? "border-[3px] border-accent-green" : "border-red-400"
      }`}
    >
      <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-surface-2">
        <Icon className={`h-6 w-6 ${config.iconClassName}`} />
      </div>

      <h2 className="mb-2 font-heading text-lg font-bold">{config.title}</h2>

      {result === "VALID" && ticket && (
        <p className="text-sm text-text-dim">
          Código {ticket.code}
          {ticket.seat && ` · Assento ${ticket.seat.code}`}
          {ticket.usedAt && ` · Entrada às ${formatEventTime(ticket.usedAt)}`}
        </p>
      )}

      {result === "INVALID" && (
        <p className="text-sm text-text-dim">
          {reason ?? "Código não encontrado ou não reconhecido."}
        </p>
      )}

      {result === "ALREADY_USED" && ticket && (
        <p className="text-sm text-text-dim">
          Código {ticket.code} · {ticket.event.title}
        </p>
      )}

      {result === "WRONG_EVENT" && ticket && (
        <p className="text-sm text-text-dim">
          Este ingresso pertence a: {ticket.event.title}
        </p>
      )}
    </div>
  );
}
