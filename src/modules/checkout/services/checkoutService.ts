export type CheckoutStatus = 'initiated' | 'pending' | 'confirmed' | 'failed';

export interface CheckoutEvent {
  id?: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  partnerId: string | null;
  status: CheckoutStatus;
  paymentMethod: string;
  externalId?: string | null;
  provider?: string | null;
  providerMetadata?: any;
  confirmedAt?: any;
  failedAt?: any;
  createdAt: any;
  updatedAt: any;
}

import { apiClient } from '@/src/lib/apiClient';
import { auth } from '@/src/firebase';

export const checkoutService = {
  /**
   * Create Stripe Checkout Session
   */
  async createStripeSession(data: { 
    packageId: string; 
    packageName: string; 
    amount: number; 
    adId?: string;
    type: 'wallet_deposit' | 'package_purchase' | 'ad_payment'
  }) {
    return await apiClient.post<{ url: string }>('/stripe/create-checkout-session', data);
  },

  /**
   * Generate Pro-forma Invoice (Predračun)
   */
  async generateInvoice(data: {
    packageId: string;
    packageName: string;
    amount: number;
    customerInfo: {
      name: string;
      email: string;
      pib?: string;
      address?: string;
    }
  }) {
    // If apiClient doesn't support blob, we might need to use native fetch for this specific call
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/checkout/generate-proforma`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Failed to generate invoice');
    return await response.blob();
  },

  /**
   * Simple create checkout session via API
   */
  async createCheckout(data: { packageId: string; amount: number; paymentMethod: string }) {
    return await apiClient.post<any>('/checkout', data);
  },

  /**
   * Main entry point for the checkout flow (Legacy compatibility or future complex flow)
   */
  async processCheckoutFlow(data: any): Promise<void> {
    const result = await this.createCheckout(data);
    console.log('Checkout flow initiated:', result);
    // Simulate immediate success for now
    if (result.id) {
       await this.updateCheckoutStatus(result.id, 'confirmed');
    }
  },

  async updateCheckoutStatus(id: string, status: CheckoutStatus) {
    return await apiClient.patch(`/checkout/${id}`, { status });
  },

  async fetchAllCheckouts(): Promise<CheckoutEvent[]> {
    // This should also be an API call if we want strict full-stack
    try {
      return await apiClient.get<CheckoutEvent[]>('/admin/checkouts');
    } catch (e) {
      return [];
    }
  }
};
