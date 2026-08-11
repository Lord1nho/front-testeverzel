import { apiClient } from "@/lib/api-client";
import type { EventSummary, PublicEventDetail, Seat } from "@/types/event";

export function listPublishedEvents() {
  return apiClient.get<{ events: EventSummary[] }>("/api/public/events");
}

export function getPublishedEvent(id: string) {
  return apiClient.get<{ event: PublicEventDetail }>(`/api/public/events/${id}`);
}

export function getEventSeats(id: string) {
  return apiClient.get<{ seats: Seat[] }>(`/api/public/events/${id}/seats`);
}
