export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

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
}

export interface EventSummary {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  capacity: number;
  price: number;
  status: EventStatus;
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
