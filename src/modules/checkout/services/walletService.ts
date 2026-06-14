import { withRetry } from "@/src/lib/retry";
import { apiClient } from "@/src/lib/apiClient";
import { mutationGuard } from "@/src/lib/mutationGuard";

export interface WalletTransaction {
  id: string;
  type: string;
  createdAt?: {
    toDate: () => Date;
    seconds: number;
    nanoseconds: number;
  };
  description?: string;
  status: 'completed' | 'pending' | 'failed' | string;
  amount: number;
}

export interface PendingDeposit {
  id: string;
  userId: string;
  userName?: string;
  userEmail: string;
  amount: number;
  createdAt: string;
  referenceNumber: string;
}

export const walletService = {
  /**
   * Promotes an entity by deducting cost from the user's wallet.
   */
  async promoteEntity(data: {
    entityId: string;
    collection: string;
    durationDays: number;
    cost: number;
    promoteType: "premium" | "urgent";
  }): Promise<void> {
    return mutationGuard(
      () =>
        withRetry(async () => {
          try {
            return await apiClient.post<void>("/wallet/promote", data);
          } catch (e: unknown) {
            const err = e as Error;
            throw new Error(
              err.message || "Došlo je do greške pri povezivanju sa novčanikom",
            );
          }
        }),
      { actionName: "promoteEntity", context: { data } },
    );
  },

  /**
   * Fetches the transaction ledger for the current user.
   */
  async fetchTransactions(_userId: string): Promise<WalletTransaction[]> {
    return withRetry(async () => {
      try {
        return await apiClient.get<WalletTransaction[]>("/wallet/transactions");
      } catch (e: unknown) {
        throw new Error("Došlo je do greške pri dohvatanju transakcija");
      }
    });
  },

  /**
   * Creates a manual invoice deposit request.
   */
  async createManualDeposit(amount: number): Promise<{
    transactionId: string;
    referenceNumber: string;
    amount: number;
  }> {
    return withRetry(async () => {
      try {
        return await apiClient.post<{
          transactionId: string;
          referenceNumber: string;
          amount: number;
        }>("/wallet/deposit/manual", { amount });
      } catch (e: unknown) {
        const err = e as Error;
        throw new Error(
          err.message || "Došlo je do greške pri kreiranju zahteva",
        );
      }
    });
  },

  /**
   * Fetches pending deposits (Admin only).
   */
  async fetchPendingDeposits(): Promise<PendingDeposit[]> {
    return withRetry(async () => {
      try {
        return await apiClient.get<PendingDeposit[]>("/wallet/admin/pending-deposits");
      } catch (e: unknown) {
        throw new Error("Došlo je do greške pri dohvatanju uplata na čekanju");
      }
    });
  },

  /**
   * Approves or rejects a deposit (Admin only).
   */
  async approveDeposit(
    transactionId: string,
    action: "approve" | "reject",
  ): Promise<void> {
    return withRetry(async () => {
      try {
        return await apiClient.post<void>(
          `/wallet/admin/approve-deposit/${transactionId}`,
          { action },
        );
      } catch (e: unknown) {
        const err = e as Error;
        throw new Error(err.message || "Došlo je do greške");
      }
    });
  },

  /**
   * Adds SG credits to a user's wallet (Admin only).
   */
  async adminAddFunds(
    targetUserId: string,
    amount: number,
    description: string
  ): Promise<void> {
    return mutationGuard(
      () =>
        withRetry(async () => {
          try {
            return await apiClient.post<void>("/wallet/admin/add-funds", {
              targetUserId,
              amount,
              description,
            });
          } catch (e: unknown) {
            const err = e as Error;
            throw new Error(
              err.message || "Došlo je do greške pri dodavanju sredstava",
            );
          }
        }),
      { actionName: "adminAddFunds", context: { targetUserId, amount, description } },
    );
  },
};
