import type { Venue } from "@/types/event";

export type GateValidationResult = "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";

export interface GateEventLookup {
  id: string;
  title: string;
  startsAt: string;
  venue: Venue;
  room: number;
}

export interface GateEventRef {
  id: string;
  title: string;
}

export interface GateSeatRef {
  id: string;
  code: string;
}

export interface GateTicketSummary {
  id: string;
  code: string;
  event: GateEventRef;
  seat?: GateSeatRef;
  usedAt?: string;
}

export interface GateValidationResponse {
  result: GateValidationResult;
  ticket: GateTicketSummary | null;
  // Motivo específico do resultado (ex.: "Entrada ainda não liberada...",
  // "Sessão encerrada...", "Código não encontrado."). Só o backend decide o
  // texto — o frontend apenas exibe. Pode vir null quando o resultado já é
  // autoexplicativo (ex.: VALID).
  reason: string | null;
}
