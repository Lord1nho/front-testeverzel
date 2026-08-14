import { apiClient } from "@/lib/api-client";
import type { ShareLink, TicketDetail, TicketSummary } from "@/types/ticket";

export function listTickets() {
  return apiClient.get<{ tickets: TicketSummary[] }>("/api/tickets");
}

export function getTicket(id: string) {
  return apiClient.get<{ ticket: TicketDetail }>(`/api/tickets/${id}`);
}

export function shareTicket(id: string) {
  return apiClient.post<{ shareLink: ShareLink }>(`/api/tickets/${id}/share`);
}
