import { apiClient } from "@/lib/api-client";
import type { EventDetail, EventSummary, Venue } from "@/types/event";

export interface CreateEventInput {
  tmdbId: number;
  title?: string;
  startsAt: string;
  venue: Venue;
  room: number;
  capacity: number;
  price: number;
}

export interface UpdateEventInput {
  title?: string;
  startsAt?: string;
  venue?: Venue;
  room?: number;
  capacity?: number;
  price?: number;
}

export function listEvents() {
  return apiClient.get<{ events: EventSummary[] }>("/api/events");
}

export function getEvent(id: string) {
  return apiClient.get<{ event: EventDetail }>(`/api/events/${id}`);
}

export function createEvent(input: CreateEventInput) {
  return apiClient.post<{ event: EventDetail }>("/api/events", input);
}

export function updateEvent(id: string, input: UpdateEventInput) {
  return apiClient.patch<{ event: EventDetail }>(`/api/events/${id}`, input);
}

export function publishEvent(id: string) {
  return apiClient.post<{ event: EventDetail }>(`/api/events/${id}/publish`);
}

export function deleteEvent(id: string) {
  return apiClient.delete<void>(`/api/events/${id}`);
}
