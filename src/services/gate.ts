import { apiClient } from "@/lib/api-client";
import type { GateEventLookup, GateValidationResponse } from "@/types/gate";

export interface ValidateTicketInput {
  eventId: string;
  code: string;
}

export function validateTicket(input: ValidateTicketInput) {
  return apiClient.post<GateValidationResponse>("/api/gate/validate", input);
}

export function findTicketEvent(code: string) {
  return apiClient.get<{ event: GateEventLookup }>(
    `/api/gate/tickets/${encodeURIComponent(code)}/event`,
  );
}
