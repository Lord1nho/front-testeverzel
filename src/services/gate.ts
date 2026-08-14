import { apiClient } from "@/lib/api-client";
import type { GateEventLookup, GateValidationResponse } from "@/types/gate";

export interface ValidateTicketInput {
  eventId: string;
  code: string;
  // Presente só quando o código veio da leitura do QR (qrValue no formato
  // "<code>.<hmac>") — o backend recalcula o HMAC e compara, provando que o
  // QR não foi forjado. Na digitação manual não tem como ter isso, então
  // fica ausente (o backend já trata os dois casos: token ausente = validação
  // sem checagem de assinatura, igual sempre foi pro fluxo manual).
  token?: string;
}

export function validateTicket(input: ValidateTicketInput) {
  return apiClient.post<GateValidationResponse>("/api/gate/validate", input);
}

export function findTicketEvent(code: string) {
  return apiClient.get<{ event: GateEventLookup }>(
    `/api/gate/tickets/${encodeURIComponent(code)}/event`,
  );
}
