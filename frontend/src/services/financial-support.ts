import api from "@/lib/axios";

export interface FinancialSupportRequest {
  id: string;
  requesterId: string;
  amountNeeded: number;
  amountReceived: number;
  reason: string;
  additionalNotes?: string;
  status: "OPEN" | "PARTIALLY_FUNDED" | "GOAL_REACHED" | "CANCELLED" | "CLOSED" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    department?: string;
    school?: string;
    region?: string;
  };
  contributions?: FinancialContribution[];
  _count?: {
    contributions: number;
  };
}

export interface FinancialContribution {
  id: string;
  supportRequestId: string;
  contributorId: string;
  recipientId: string;
  amount: number;
  transactionReference: string;
  createdAt: string;
  contributor: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    department?: string;
  };
}

export interface CreateFinancialSupportRequestDto {
  amountNeeded: number;
  reason: string;
  additionalNotes?: string;
}

export interface ContributeFinancialSupportDto {
  supportRequestId: string;
  amount: number;
}

export interface FinancialSupportRequestsResponse {
  requests: FinancialSupportRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContributionResponse {
  contribution: FinancialContribution;
  supportRequest: FinancialSupportRequest;
  goalReached: boolean;
}

export interface MyContributionsResponse {
  contributions: Array<
    FinancialContribution & {
      supportRequest: FinancialSupportRequest;
    }
  >;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const financialSupportApi = {
  /**
   * Create a new financial support request
   */
  createRequest: async (
    data: CreateFinancialSupportRequestDto
  ): Promise<FinancialSupportRequest> => {
    const response = await api.post("/support/financial-requests", data);
    return response.data;
  },

  /**
   * Get all financial support requests with optional filters
   */
  getRequests: async (params?: {
    status?: FinancialSupportRequest["status"];
    requesterId?: string;
    page?: number;
    limit?: number;
  }): Promise<FinancialSupportRequestsResponse> => {
    const response = await api.get("/support/financial-requests", { params });
    return response.data;
  },

  /**
   * Get a single financial support request by ID
   */
  getRequestById: async (requestId: string): Promise<FinancialSupportRequest> => {
    const response = await api.get(`/support/financial-requests/${requestId}`);
    return response.data;
  },

  /**
   * Contribute to a financial support request
   */
  contribute: async (
    data: ContributeFinancialSupportDto
  ): Promise<ContributionResponse> => {
    const response = await api.post("/support/financial-requests/contribute", data);
    return response.data;
  },

  /**
   * Cancel a financial support request (requester only)
   */
  cancelRequest: async (requestId: string): Promise<FinancialSupportRequest> => {
    const response = await api.patch(`/support/financial-requests/${requestId}/cancel`);
    return response.data;
  },

  /**
   * Get my contribution history
   */
  getMyContributions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<MyContributionsResponse> => {
    const response = await api.get("/support/financial-contributions/my-contributions", {
      params,
    });
    return response.data;
  },
};
