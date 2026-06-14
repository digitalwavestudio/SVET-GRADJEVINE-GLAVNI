export interface PaymentSagaContext {
  userId: string;
  amount: number;
  type: "wallet_deposit" | "package_purchase" | "ad_payment";
  adId?: string;
  packageId?: string;
  currency: string;
  referenceId: string;
  role?: string;
}
