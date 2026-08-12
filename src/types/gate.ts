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
}
