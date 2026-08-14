export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type SessionStatus = "SCHEDULED" | "STARTED" | "ENDED";
export type Venue = "CINE_VERZEL_1" | "CINE_VERZEL_2";

export interface EventCatalogItemSummary {
  id: string;
  title: string;
  imageUrl: string | null;
}

export interface EventCatalogItem extends EventCatalogItemSummary {
  provider: string;
  externalId: string;
  type: string;
  description: string;
  durationMinutes: number | null;
}

export interface EventSummary {
  id: string;
  title: string;
  startsAt: string;
  venue: Venue;
  room: number;
  capacity: number;
  price: number;
  status: EventStatus;
  sessionStatus: SessionStatus;
  sessionEndsAt: string;
  seatsAvailable: number;
  catalogItem: EventCatalogItemSummary;
  createdAt: string;
}

export interface EventDetail
  extends Omit<EventSummary, "catalogItem" | "seatsAvailable"> {
  organizerId: string;
  seatsTotal: number;
  seatsAvailable: number;
  catalogItem: EventCatalogItem;
  updatedAt: string;
}

export interface PublicEventDetail extends Omit<EventSummary, "catalogItem"> {
  seatsTotal: number;
  catalogItem: EventCatalogItem;
  updatedAt: string;
}

export type SeatStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface Seat {
  id: string;
  code: string;
  status: SeatStatus;
}
