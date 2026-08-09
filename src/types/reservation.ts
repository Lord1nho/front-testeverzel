import type { Venue } from "@/types/event";

export type ReservationStatus = "PENDING_PAYMENT";

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

export interface Reservation {
  id: string;
  status: ReservationStatus;
  quantity: number;
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
  event: ReservationEventSummary;
  seats: ReservationSeat[];
}
