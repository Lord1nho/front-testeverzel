import type { Venue } from "@/types/event";

export type TicketStatus = "VALID" | "USED" | "CANCELLED";

export interface TicketEventSummary {
  id: string;
  title: string;
  startsAt: string;
  venue: Venue;
  room: number;
}

export interface TicketSeatSummary {
  id: string;
  code: string;
}

export interface TicketSummary {
  id: string;
  status: TicketStatus;
  code: string;
  issuedAt: string;
  usedAt: string | null;
  event: TicketEventSummary;
  seat: TicketSeatSummary;
}

export interface TicketDetail extends TicketSummary {
  qrValue: string;
}

export interface ShareLink {
  token: string;
  expiresAt: string | null;
}
