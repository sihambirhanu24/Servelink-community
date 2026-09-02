import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, adminApi } from '@/lib/axios';
import { toast } from 'sonner';

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
  restreamPlayerUrl?: string;
  restreamChannelId?: string;
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
    mutationFn: async (payload: { topic: string; description?: string; scheduledStart: string; duration: number; isPaid?: boolean; price?: number; maxParticipants?: number }) => {
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

export function useLiveSessionToken(id: string, enabled: boolean = true, isAdmin: boolean = false) {
  return useQuery({
    queryKey: ['live-sessions', id, 'token', { isAdmin }],
    queryFn: async () => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.get<{ token: string; room: string }>(`/live-sessions/${id}/token`);
      return data;
    },
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useUpdateLiveSessionStatus(isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, restreamPlayerUrl, restreamChannelId }: { id: string; status: 'LIVE' | 'COMPLETED' | 'CANCELLED'; restreamPlayerUrl?: string; restreamChannelId?: string }) => {
      const client = isAdmin ? adminApi : api;
      const { data } = await client.patch(`/live-sessions/${id}/status`, { status, restreamPlayerUrl, restreamChannelId });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions', id] });
    },
  });
}
