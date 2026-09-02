import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface CreatePaymentDto {
  liveSessionId: string;
  amount: number;
  paymentMethod: 'CHAPA' | 'TELEBIRR' | 'CBE_BIRR' | 'MPESA' | 'BANK_CARD' | 'BANK_TRANSFER';
  currency?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PaymentResponse {
  paymentId: string;
  transactionRef: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentDto {
  transactionRef: string;
}

export interface VerifyPaymentResponse {
  status: string;
  verifiedAt: string;
  message: string;
}

export interface RequestPayoutDto {
  amount: number;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
  currency?: string;
}

export interface WalletData {
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
  paidOutEarnings: number;
  platformFeePercent: number;
  minPayoutAmount: number;
  recentEarnings: any[];
  recentPayouts: any[];
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  reference: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  processedBy?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentsApi = {
  // Initialize payment
  async createPayment(dto: CreatePaymentDto, token: string): Promise<PaymentResponse> {
    const response = await axios.post(`${API_BASE_URL}/payments/initialize`, dto, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Verify payment
  async verifyPayment(dto: VerifyPaymentDto, token: string): Promise<VerifyPaymentResponse> {
    const response = await axios.post(`${API_BASE_URL}/payments/verify`, dto, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get payment history
  async getPaymentHistory(token: string) {
    const response = await axios.get(`${API_BASE_URL}/payments/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get payment by ID
  async getPaymentById(id: string, token: string) {
    const response = await axios.get(`${API_BASE_URL}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get teacher wallet
  async getTeacherWallet(token: string): Promise<WalletData> {
    const response = await axios.get(`${API_BASE_URL}/payouts/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Request payout
  async requestPayout(dto: RequestPayoutDto, token: string): Promise<Payout> {
    const response = await axios.post(`${API_BASE_URL}/payouts/request`, dto, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get Chapa Banks
  async getChapaBanks(token: string) {
    const response = await axios.get(`${API_BASE_URL}/payouts/banks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Verify Payout Status
  async verifyPayoutStatus(reference: string, token: string): Promise<Payout> {
    const response = await axios.get(`${API_BASE_URL}/payouts/verify/${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get payout history
  async getPayoutHistory(token: string): Promise<Payout[]> {
    const response = await axios.get(`${API_BASE_URL}/payouts/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Admin: Get all payouts
  async getAllPayouts(token: string, status?: string, page = 1, limit = 20) {
    const params: any = { page, limit };
    if (status) params.status = status;
    const response = await axios.get(`${API_BASE_URL}/payouts/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  // Admin: Approve payout
  async approvePayout(id: string, token: string): Promise<Payout> {
    const response = await axios.patch(`${API_BASE_URL}/payouts/admin/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Admin: Reject payout
  async rejectPayout(id: string, reason: string, token: string): Promise<Payout> {
    const response = await axios.patch(
      `${API_BASE_URL}/payouts/admin/${id}/reject`,
      { reason },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  // Admin: Process payout
  async processPayout(id: string, token: string): Promise<Payout> {
    const response = await axios.patch(`${API_BASE_URL}/payouts/admin/${id}/process`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Admin: Complete payout
  async completePayout(id: string, token: string): Promise<Payout> {
    const response = await axios.patch(`${API_BASE_URL}/payouts/admin/${id}/complete`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Admin: Get finance dashboard
  async getFinanceDashboard(token: string) {
    const response = await axios.get(`${API_BASE_URL}/payouts/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Student: Get my payment history
  async getPaymentHistory(token: string) {
    const response = await axios.get(`${API_BASE_URL}/payments/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Student: Get specific payment receipt
  async getPaymentById(id: string, token: string) {
    const response = await axios.get(`${API_BASE_URL}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
