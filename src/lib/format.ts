export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatSessionDateLabel(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const diffDays = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);

  if (diffDays === 0) return `Hoje, ${day}`;
  if (diffDays === 1) return `Amanhã, ${day}`;

  const weekday = weekdayFormatter.format(date).replace(".", "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

const ISO_DATE_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;

/**
 * Algumas mensagens de erro da API embutem timestamps ISO/UTC crus (ex.:
 * conflito de horário de evento). Troca por data/hora formatada em pt-BR,
 * sem mexer no resto do texto.
 */
export function formatApiErrorMessage(message: string): string {
  return message.replace(ISO_DATE_PATTERN, (match) => formatEventDateTime(match));
}
