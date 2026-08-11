import { apiClient } from "@/lib/api-client";
import type { CardInput, PaymentResult } from "@/types/payment";

export interface CreatePaymentInput {
  reservationId: string;
  card: CardInput;
}

export function createPayment(input: CreatePaymentInput) {
  return apiClient.post<PaymentResult>("/api/payments", input);
}
