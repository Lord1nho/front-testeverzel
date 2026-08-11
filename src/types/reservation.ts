import type { Venue } from "@/types/event";
import type { TicketStatus } from "@/types/ticket";

export type ReservationStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PAYMENT_DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export interface ReservationSeat {
  id: string;
  code: string;
}

export interface ReservationEventSummary {
  id: string;
  title: string;
  startsAt: string;
  venue: Venue;
  room: number;
}

export interface ReservationTicket {
  id: string;
  code: string;
  status: TicketStatus;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  quantity: number;
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
  event: ReservationEventSummary;
  seats: ReservationSeat[];
  tickets: ReservationTicket[];
}
