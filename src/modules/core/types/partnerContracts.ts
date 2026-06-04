export interface PartnerConversionContract {
  partnerId: string;
  userId: string;
  checkoutId: string;
  amount: number;
  commissionAmount: number;
  attributionSource: string; // url_ref, checkout_promo, etc
  attributionTimestamp: string;
}
