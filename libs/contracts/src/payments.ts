export interface PaymentsStatus {
  teamId: string;
  connected: boolean;
  payoutsEnabled: boolean;
  stripeConfigured?: boolean;
}

export interface CheckoutSessionResult {
  url: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
