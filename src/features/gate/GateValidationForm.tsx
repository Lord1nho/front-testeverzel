"use client";

import type { FormEvent, RefObject } from "react";

const inputClassName =
  "w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-dim focus:border-accent-cyan";

interface GateValidationFormProps {
  code: string;
  onCodeChange: (value: string) => void;
  submitting: boolean;
  onSubmit: (code: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  submitLabel?: string;
  submittingLabel?: string;
}

export function GateValidationForm({
  code,
  onCodeChange,
  submitting,
  onSubmit,
  inputRef,
  submitLabel = "Validar ingresso",
  submittingLabel = "Validando...",
}: GateValidationFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6">
      <label htmlFor="gate-code" className="mb-1.5 block text-xs text-text-mute">
        Código manual do ingresso
      </label>
      <input
        id="gate-code"
        ref={inputRef}
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        placeholder="Ex: A1B2C3D4"
        autoComplete="off"
        autoFocus
        className={inputClassName}
      />

      <button
        type="submit"
        disabled={submitting || !code.trim()}
        className="mt-4 w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
