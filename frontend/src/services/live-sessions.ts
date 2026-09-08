import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, adminApi } from '@/lib/axios';
import { toast } from 'sonner';

export type LiveKitRole = 'HOST' | 'VIEWER';

export type LiveSessionProvider = 'LIVEKIT' | 'GOOGLE_MEET';

export interface LiveKitTokenResponse {
  token: string;
  serverUrl: string;
  roomName: string;
  role: LiveKitRole;
  expiresIn: number;
}

export type LiveSessionStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RESCHEDULED' | 'CANCELLED' | 'LIVE' | 'COMPLETED' | 'NO_SHOW';

export interface LiveSession {
  id: string;
  topic: string;
  description?: string;
  scheduledStart: string;
  duration: number;
  status: LiveSessionStatus;
  teacherId: string;
  teacher?: { id: string; firstName: string; lastName: string; email: string; profileImage: string };
  adminId?: string;
  admin?: { id: string; name: string; email: string };
  rejectionReason?: string;
  meetingRoomId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  price?: number;
  isPaid?: boolean;
  livekitRoomName?: string;
  cancelledAt?: string;
  archivedAt?: string;
  provider?: LiveSessionProvider;
  meetingUrl?: string;
  access?: {
    canAccess: boolean;
    role: string;
    registrationStatus: string;
    paymentStatus?: string | null;
    refundStatus?: string | null;
    sessionCancelled?: boolean;
  };
  hostActions?: {
    canDelete: boolean;
    canCancel: boolean;
    isCancelled: boolean;
    paidParticipants: number;
    totalCollected: number;
    hasFinancialHistory: boolean;
  };
  refundSummary?: {
    paidParticipants: number;
    totalCollected: number;
    refundedCount: number;
    refundedAmount: number;
    pendingCount: number;
    pendingAmount: number;
    processingCount: number;
    processingAmount: number;
    failedCount: number;
    failedAmount: number;
  };
}

export function useLiveSessions(isAdmin: boolean = false) {
  return useQuery({
    queryKey: ['live-sessions', { isAdmin }],
    queryFn: async () => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.get<LiveSession[]>('/live-sessions');
      return data;
    },
  });
}

export function useLiveSession(id: string, isAdmin: boolean = false) {
  return useQuery({
    queryKey: ['live-sessions', id, { isAdmin }],
    queryFn: async () => {
      if (!id) return null;
      const client = isAdmin ? adminApi : api;
      const { data } = await client.get<LiveSession>(`/live-sessions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      topic: string;
      description?: string;
      scheduledStart: string;
      duration: number;
      isPaid?: boolean;
      price?: number;
      maxParticipants?: number;
      provider?: LiveSessionProvider;
      meetingUrl?: string;
    }) => {
      const { data } = await api.post('/live-sessions', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Live session requested successfully');
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request live session');
    },
  });
}

export function useApproveLiveSession(isAdmin: boolean = true) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adminId }: { id: string; adminId?: string }) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.patch(`/live-sessions/${id}/approve`, { adminId });
      return data;
    },
    onSuccess: (_, { id }) => {
      toast.success('Session approved');
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve session');
    },
  });
}

export function useRejectLiveSession(isAdmin: boolean = true) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.patch(`/live-sessions/${id}/reject`, { reason });
      return data;
    },
    onSuccess: (_, { id }) => {
      toast.success('Session rejected');
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject session');
    },
  });
}

export function useRescheduleLiveSession(isAdmin: boolean = true) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scheduledStart }: { id: string; scheduledStart: string }) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.patch(`/live-sessions/${id}/reschedule`, { scheduledStart });
      return data;
    },
    onSuccess: (_, { id }) => {
      toast.success('Session rescheduled');
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reschedule session');
    },
  });
}

export function useLiveKitToken(id: string, enabled: boolean = true, isAdmin: boolean = false) {
  return useQuery({
    queryKey: ['live-sessions', id, 'livekit-token', { isAdmin }],
    queryFn: async () => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.post<{
        token: string;
        serverUrl: string;
        roomName: string;
        role: 'HOST' | 'VIEWER';
      }>(`/live-sessions/${id}/livekit/token`);
      return data;
    },
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useUpdateLiveSessionStatus(isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'LIVE' | 'COMPLETED' | 'CANCELLED' }) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.patch(`/live-sessions/${id}/status`, { status });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', id] });
      queryClient.invalidateQueries({ queryKey: ['discoverable-live-sessions'] });
    },
  });
}

function invalidateLiveSessionQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
  queryClient.invalidateQueries({ queryKey: ['discoverable-live-sessions'] });
  queryClient.invalidateQueries({ queryKey: ['wallet'] });
  if (id) {
    queryClient.invalidateQueries({ queryKey: ['live-sessions', id] });
  }
}

export function useDeleteLiveSession(isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.delete(`/live-sessions/${id}`);
      return data;
    },
    onSuccess: (_, id) => {
      toast.success('Session deleted');
      invalidateLiveSessionQueries(queryClient, id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'This session cannot be deleted');
    },
  });
}

export function useCancelLiveSession(isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.post(`/live-sessions/${id}/cancel`);
      return data;
    },
    onSuccess: (result, id) => {
      toast.success(result?.alreadyCancelled ? 'Session is already cancelled' : 'Session cancelled');
      invalidateLiveSessionQueries(queryClient, id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel session');
    },
  });
}

export function useCancellationPreview(id: string, enabled = false) {
  return useQuery({
    queryKey: ['live-sessions', id, 'cancellation-preview'],
    queryFn: async () => {
      const { data } = await api.get(`/live-sessions/${id}/cancellation-preview`);
      return data;
    },
    enabled: !!id && enabled,
  });
}

export function useArchiveLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await adminApi.patch(`/live-sessions/${id}/archive`);
      return data;
    },
    onSuccess: (_, id) => {
      toast.success('Session archived');
      invalidateLiveSessionQueries(queryClient, id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to archive session');
    },
  });
}
