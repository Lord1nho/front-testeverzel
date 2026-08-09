export type EventStatus = "DRAFT" | "PUBLISHED";

export interface CatalogItem {
  id: string;
  provider: string;
  title: string;
  genre: string;
}

export interface OrganizerEvent {
  id: string;
  catalogItem: CatalogItem;
  date: string;
  venue: string;
  capacity: number;
  price: number;
  status: EventStatus;
}
