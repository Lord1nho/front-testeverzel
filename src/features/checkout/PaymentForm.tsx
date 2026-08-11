"use client";

import { useState, type FormEvent } from "react";
import { formatCurrency } from "@/lib/format";
import type { CardInput } from "@/types/payment";

const inputClassName =
  "w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-dim focus:border-accent-cyan";

interface PaymentFormProps {
  totalAmount: number;
  submitting: boolean;
  error: string | null;
  onSubmit: (card: CardInput) => void;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function validateCard(fields: {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}): string | null {
  const digitsOnly = fields.number.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digitsOnly)) return "Número do cartão inválido.";
  if (!fields.holderName.trim()) return "Informe o nome impresso no cartão.";
  const month = Number(fields.expiryMonth);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Mês de validade inválido.";
  }
  const year = Number(fields.expiryYear);
  if (!Number.isInteger(year) || year < new Date().getFullYear()) {
    return "Ano de validade inválido.";
  }
  if (!/^\d{3,4}$/.test(fields.cvv)) return "CVV inválido.";
  return null;
}

export function PaymentForm({ totalAmount, submitting, error, onSubmit }: PaymentFormProps) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateCard({ number, holderName, expiryMonth, expiryYear, cvv });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    onSubmit({
      number: number.replace(/\s/g, ""),
      holderName: holderName.trim(),
      expiryMonth: Number(expiryMonth),
      expiryYear: Number(expiryYear),
      cvv,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 rounded-2xl border border-border bg-surface p-8"
    >
      <h3 className="mb-1.5 font-heading text-base font-semibold">Cartão de crédito</h3>
      <p className="mb-6 text-xs text-text-mute">
        Pagamento simulado — nenhuma cobrança real. Cartões terminados em 0000 são recusados.
      </p>

      <div className="flex max-w-md flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs text-text-mute">Número do cartão</label>
          <input
            value={number}
            onChange={(event) => setNumber(formatCardNumber(event.target.value))}
            placeholder="4111 1111 1111 1111"
            inputMode="numeric"
            autoComplete="off"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-text-mute">
            Nome impresso no cartão
          </label>
          <input
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            placeholder="Como está no cartão"
            autoComplete="off"
            className={inputClassName}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">Mês</label>
            <input
              value={expiryMonth}
              onChange={(event) => setExpiryMonth(event.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="12"
              inputMode="numeric"
              maxLength={2}
              autoComplete="off"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">Ano</label>
            <input
              value={expiryYear}
              onChange={(event) => setExpiryYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="2030"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">CVV</label>
            <input
              value={cvv}
              onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      {(formError || error) && (
        <p className="mt-4 max-w-md rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {formError ?? error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full max-w-md rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Processando..." : `Pagar ${formatCurrency(totalAmount)}`}
      </button>
    </form>
  );
}
