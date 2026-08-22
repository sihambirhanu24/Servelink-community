import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useAdminLocationRequests(status?: string) {
  return useQuery({
    queryKey: ['admin-location-requests', status],
    queryFn: async () => {
      const url = status ? `/admin/location-change-requests?status=${status}` : '/admin/location-change-requests';
      const { data } = await api.get(url);
      return data;
    },
  });
}

export function useApproveLocationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/admin/location-change-requests/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-location-requests'] });
    },
  });
}

export function useRejectLocationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.patch(`/admin/location-change-requests/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-location-requests'] });
    },
  });
}
