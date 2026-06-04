export interface CreatePaymentSessionContract {
  checkoutId: string;
  amount: number;
  currency: string;
  userId: string;
  packageName: string;
  packageId: string;
  partnerId: string | null;
  paymentMethod: string;
  metadata?: Record<string, any>;
}

export interface PaymentSessionResponse {
  sessionId: string;
  externalId: string;
  url?: string;
  status: 'initiated' | 'pending';
}

export interface PaymentWebhookContract {
  provider: 'stripe' | 'paypal' | 'ips' | 'manual';
  externalId: string;
  status: 'confirmed' | 'failed' | 'refunded';
  amountRecieved?: number;
  payload: any;
}
