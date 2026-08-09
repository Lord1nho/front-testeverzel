import { apiClient } from "@/lib/api-client";
import type { Reservation } from "@/types/reservation";

export interface CreateReservationInput {
  eventId: string;
  seatIds: string[];
}

export function createReservation(input: CreateReservationInput) {
  return apiClient.post<{ reservation: Reservation }>("/api/reservations", input);
}

export function getReservation(id: string) {
  return apiClient.get<{ reservation: Reservation }>(`/api/reservations/${id}`);
}
