import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProviderProfile,
  updateProviderProfile,
  getMyProviderProfile,
  getProviderProfile,
  discoverProviders,
  getProviderStats,
  createSupportRequest,
  getMySupportRequests,
  getProviderRequests,
  getSupportRequest,
  acceptSupportRequest,
  declineSupportRequest,
  startSupport,
  completeSupportRequest,
  cancelSupportRequest,
  rateSupportProvider,
  getSupportChatRoom,
  getDashboardStats,
  CreateProviderProfileDto,
  UpdateProviderProfileDto,
  CreateSupportRequestDto,
  CreateRatingDto,
  SupportType,
  SupportRequestStatus,
  SupportUrgency,
} from '@/services/support';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────
// PROVIDER PROFILE HOOKS
// ─────────────────────────────────────────────────────────────────────────

export function useCreateProviderProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProviderProfileDto) =>
      createProviderProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      toast.success('Provider profile created successfully');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to create provider profile',
      );
    },
  });
}

export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProviderProfileDto) =>
      updateProviderProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      toast.success('Provider profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to update provider profile',
      );
    },
  });
}

export function useMyProviderProfile() {
  return useQuery({
    queryKey: ['my-provider-profile'],
    queryFn: getMyProviderProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProviderProfile(teacherId: string | null | undefined) {
  return useQuery({
    queryKey: ['provider-profile', teacherId],
    queryFn: () => getProviderProfile(teacherId!),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDiscoverProviders(params?: {
  search?: string;
  supportType?: SupportType;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['discover-providers', params],
    queryFn: () => discoverProviders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProviderStats() {
  return useQuery({
    queryKey: ['provider-stats'],
    queryFn: getProviderStats,
    staleTime: 5 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// SUPPORT REQUEST HOOKS
// ─────────────────────────────────────────────────────────────────────────

export function useCreateSupportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupportRequestDto) => createSupportRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support-requests'] });
      toast.success('Support request created successfully');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to create support request',
      );
    },
  });
}

export function useMySupportRequests(params?: {
  status?: SupportRequestStatus;
  supportType?: SupportType;
  urgency?: SupportUrgency;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['my-support-requests', params],
    queryFn: () => getMySupportRequests(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useProviderRequests(params?: {
  status?: SupportRequestStatus;
  supportType?: SupportType;
  urgency?: SupportUrgency;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['provider-requests', params],
    queryFn: () => getProviderRequests(params),
    staleTime: 30 * 1000,
  });
}

export function useSupportRequest(requestId: string | null | undefined) {
  return useQuery({
    queryKey: ['support-request', requestId],
    queryFn: () => getSupportRequest(requestId!),
    enabled: !!requestId,
    staleTime: 30 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// REQUEST STATUS MANAGEMENT HOOKS
// ─────────────────────────────────────────────────────────────────────────

export function useAcceptSupportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => acceptSupportRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['support-request', data.id],
      });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      toast.success('Support request accepted');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to accept request',
      );
    },
  });
}

export function useDeclineSupportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => declineSupportRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['support-request', data.id],
      });
      toast.success('Support request declined');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to decline request',
      );
    },
  });
}

export function useStartSupport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => startSupport(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['support-request', data.id],
      });
      toast.success('Support started');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to start support');
    },
  });
}

export function useCompleteSupportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => completeSupportRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['support-request', data.id],
      });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      toast.success('Support completed');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to complete support',
      );
    },
  });
}

export function useCancelSupportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => cancelSupportRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-support-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['support-request', data.id],
      });
      toast.success('Support request cancelled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel request');
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// RATING HOOKS
// ─────────────────────────────────────────────────────────────────────────

export function useRateSupportProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string;
      data: CreateRatingDto;
    }) => rateSupportProvider(requestId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-support-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['support-request', variables.requestId],
      });
      toast.success('Rating submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit rating');
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// CHAT INTEGRATION HOOKS
// ─────────────────────────────────────────────────────────────────────────

export function useSupportChatRoom(requestId: string | null | undefined) {
  return useQuery({
    queryKey: ['support-chat-room', requestId],
    queryFn: () => getSupportChatRoom(requestId!),
    enabled: !!requestId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// STATISTICS HOOKS
// ─────────────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['support-dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000,
  });
}
