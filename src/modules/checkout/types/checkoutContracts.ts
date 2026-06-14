export interface CheckoutEvent {
  id?: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  partnerId: string | null;
  status: 'initiated' | 'pending' | 'confirmed' | 'failed';
  paymentMethod: string;
  externalId?: string | null;
  provider?: string | null;
  providerMetadata?: any;
  confirmedAt?: any;
  failedAt?: any;
  createdAt: any;
  updatedAt: any;
}

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
  provider: 'paypal' | 'ips' | 'manual';
  externalId: string;
  status: 'confirmed' | 'failed' | 'refunded';
  amountRecieved?: number;
  payload: any;
}
