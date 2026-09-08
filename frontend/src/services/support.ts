import api from '@/lib/axios';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

export type SupportType = 'CHAT' | 'LIVE_SESSION' | 'RESOURCE' | 'MENTORSHIP';
export type SupportUrgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type SupportRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED';
export type SupportPaymentType = 'FREE' | 'PAID';
export type SupportPaymentStatus =
  | 'NOT_REQUIRED'
  | 'RESERVED'
  | 'TRANSFERRED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FAILED';

export interface TeacherInfo {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  verified: boolean;
  level: string;
}

export interface SupportProviderProfile {
  id: string;
  teacherId: string;
  expertise: string[];
  experience: string;
  description: string;
  supportTypes: SupportType[];
  availabilityDays: string[];
  availabilityTime: string | null;
  maxActiveRequests: number;
  isAvailable: boolean;
  completedSessions: number;
  averageRating: number | null;
  totalEarnings?: number;
  createdAt: string;
  updatedAt: string;
  teacher: TeacherInfo;
}

export interface SupportRequest {
  id: string;
  requesterId: string;
  providerId: string | null;
  topic: string;
  description: string;
  supportType: SupportType;
  urgency: SupportUrgency;
  preferredAt: string | null;
  notes: string | null;
  status: SupportRequestStatus;
  chatRoomId: string | null;
  liveSessionId: string | null;
  paymentType: SupportPaymentType;
  requestedAmount: number | null;
  paymentReason: string | null;
  paymentStatus: SupportPaymentStatus;
  paymentReference: string | null;
  reservedAt: string | null;
  transferredAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  requester: TeacherInfo;
  provider: SupportProviderProfile | null;
  rating: SupportRating | null;
}

export interface SupportRating {
  id: string;
  supportRequestId: string;
  requesterId: string;
  providerId: string;
  rating: number;
  feedback: string | null;
  createdAt: string;
}

export interface CreateProviderProfileDto {
  expertise: string[];
  experience: string;
  description: string;
  supportTypes: SupportType[];
  availabilityDays: string[];
  availabilityTime?: string;
  maxActiveRequests: number;
  isAvailable: boolean;
}

export interface UpdateProviderProfileDto {
  expertise?: string[];
  experience?: string;
  description?: string;
  supportTypes?: SupportType[];
  availabilityDays?: string[];
  availabilityTime?: string;
  maxActiveRequests?: number;
  isAvailable?: boolean;
}

export interface CreateSupportRequestDto {
  topic: string;
  description: string;
  supportType: SupportType;
  urgency: SupportUrgency;
  preferredAt?: string;
  notes?: string;
  providerId?: string;
  paymentType?: SupportPaymentType;
  requestedAmount?: number;
  paymentReason?: string;
}

export interface CreateRatingDto {
  rating: number;
  feedback?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ProviderStats {
  isProvider: boolean;
  completedSessions: number;
  averageRating: number | null;
  activeRequests: number;
  isAvailable?: boolean;
}

export interface DashboardStats {
  totalProviders: number;
  availableProviders: number;
  totalRequests: number;
  activeRequests: number;
}

// ─────────────────────────────────────────────────────────────────────────
// PROVIDER PROFILE
// ─────────────────────────────────────────────────────────────────────────

export const createProviderProfile = async (
  data: CreateProviderProfileDto,
): Promise<SupportProviderProfile> => {
  const response = await api.post('/support/provider-profile', data);
  return response.data;
};

export const updateProviderProfile = async (
  data: UpdateProviderProfileDto,
): Promise<SupportProviderProfile> => {
  const response = await api.patch('/support/provider-profile', data);
  return response.data;
};

export const getMyProviderProfile = async (): Promise<SupportProviderProfile | null> => {
  const response = await api.get('/support/provider-profile/me');
  return response.data;
};

export const getProviderProfile = async (
  teacherId: string,
): Promise<SupportProviderProfile> => {
  const response = await api.get(`/support/provider-profile/${teacherId}`);
  return response.data;
};

export const discoverProviders = async (params?: {
  search?: string;
  supportType?: SupportType;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<SupportProviderProfile>> => {
  const response = await api.get('/support/providers', { params });
  return response.data;
};

export const getProviderStats = async (): Promise<ProviderStats> => {
  const response = await api.get('/support/provider-stats');
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────
// SUPPORT REQUESTS
// ─────────────────────────────────────────────────────────────────────────

export const createSupportRequest = async (
  data: CreateSupportRequestDto,
): Promise<SupportRequest> => {
  const response = await api.post('/support/requests', data);
  return response.data;
};

export const getMySupportRequests = async (params?: {
  status?: SupportRequestStatus;
  supportType?: SupportType;
  urgency?: SupportUrgency;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<SupportRequest>> => {
  const response = await api.get('/support/requests/my-requests', { params });
  return response.data;
};

export const getProviderRequests = async (params?: {
  status?: SupportRequestStatus;
  supportType?: SupportType;
  urgency?: SupportUrgency;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<SupportRequest>> => {
  const response = await api.get('/support/requests/provider-requests', {
    params,
  });
  return response.data;
};

export const getSupportRequest = async (
  requestId: string,
): Promise<SupportRequest> => {
  const response = await api.get(`/support/requests/${requestId}`);
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────
// REQUEST STATUS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────

export const acceptSupportRequest = async (
  requestId: string,
): Promise<SupportRequest> => {
  const response = await api.patch(`/support/requests/${requestId}/accept`);
  return response.data;
};

export const declineSupportRequest = async (
  requestId: string,
): Promise<SupportRequest> => {
  const response = await api.patch(`/support/requests/${requestId}/decline`);
  return response.data;
};

export const startSupport = async (requestId: string): Promise<SupportRequest> => {
  const response = await api.patch(`/support/requests/${requestId}/start`);
  return response.data;
};

export const completeSupportRequest = async (
  requestId: string,
): Promise<SupportRequest> => {
  const response = await api.patch(`/support/requests/${requestId}/complete`);
  return response.data;
};

export const cancelSupportRequest = async (
  requestId: string,
): Promise<SupportRequest> => {
  const response = await api.patch(`/support/requests/${requestId}/cancel`);
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────
// RATING
// ─────────────────────────────────────────────────────────────────────────

export const rateSupportProvider = async (
  requestId: string,
  data: CreateRatingDto,
): Promise<SupportRating> => {
  const response = await api.post(`/support/requests/${requestId}/rate`, data);
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────
// CHAT INTEGRATION
// ─────────────────────────────────────────────────────────────────────────

export const getSupportChatRoom = async (
  requestId: string,
): Promise<{ chatRoomId: string }> => {
  const response = await api.get(`/support/requests/${requestId}/chat`);
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────
// STATISTICS
// ─────────────────────────────────────────────────────────────────────────

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/support/dashboard-stats');
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────
// WALLET TYPES
// ─────────────────────────────────────────────────────────────────────────

export interface WalletBalance {
  teacherId: string;
  availableBalance: number;
  reservedBalance: number;
  totalBalance: number;
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
  supportRequestId: string | null;
  relatedTeacherId: string | null;
  description: string;
  createdAt: string;
  supportRequest?: {
    id: string;
    topic: string;
    status: string;
  };
  relatedTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// WALLET API
// ─────────────────────────────────────────────────────────────────────────

export const walletApi = {
  async getBalance(token: string): Promise<WalletBalance> {
    const response = await api.get('/wallet/balance', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getTransactions(
    token: string,
    limit = 50,
    offset = 0,
  ): Promise<{
    transactions: WalletTransaction[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await api.get('/wallet/transactions', {
      params: { limit, offset },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
