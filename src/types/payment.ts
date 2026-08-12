export type PaymentStatus = "APPROVED" | "DECLINED";

export interface CardInput {
  number: string;
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  amount: number;
  failureReason: string | null;
  paidAt: string | null;
}

export interface PaymentIssuedTicket {
  id: string;
  code: string;
  status: "VALID";
}

export interface PaymentResult {
  payment: Payment;
  reservationStatus: "PAID" | "PAYMENT_DECLINED" | "PENDING_PAYMENT";
  tickets: PaymentIssuedTicket[];
  attempt: number;
  maxAttempts: number;
}
