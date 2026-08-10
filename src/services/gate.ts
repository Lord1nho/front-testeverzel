import { apiClient } from "@/lib/api-client";
import type { GateValidationResponse } from "@/types/gate";

export interface ValidateTicketInput {
  eventId: string;
  code: string;
}

export function validateTicket(input: ValidateTicketInput) {
  return apiClient.post<GateValidationResponse>("/api/gate/validate", input);
}
