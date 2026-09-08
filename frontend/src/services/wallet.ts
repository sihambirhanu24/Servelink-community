import api from "@/lib/axios";

export interface WalletBalance {
  id: string;
  teacherId: string;
  availableBalance: number;
  reservedBalance: number;
  totalBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  teacherId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  reference: string;
  supportRequestId?: string;
  relatedTeacherId?: string;
  metadata?: any;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const walletApi = {
  /**
   * Get wallet balance for the current user
   */
  async getBalance(): Promise<WalletBalance> {
    const response = await api.get("/wallet/balance");
    return response.data;
  },

  /**
   * Get wallet transactions for the current user
   */
  async getTransactions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    transactions: WalletTransaction[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await api.get("/wallet/transactions", { params });
    return response.data;
  },
};
