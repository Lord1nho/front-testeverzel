import { apiClient } from "@/lib/api-client";
import type { TicketDetail } from "@/types/ticket";

export function getPublicTicket(token: string) {
  return apiClient.get<{ ticket: TicketDetail }>(`/api/public/tickets/${token}`);
}
