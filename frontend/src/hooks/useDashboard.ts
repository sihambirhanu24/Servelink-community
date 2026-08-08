'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboard } from '@/services/dashboard';
import { joinCommunity } from '@/services/community';
import { toast } from 'sonner';

export const DASHBOARD_KEY = 'dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: [DASHBOARD_KEY],
    queryFn: getDashboard,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useJoinCommunityFromDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => joinCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: ['my-communities-count'] });
      queryClient.invalidateQueries({ queryKey: ['community-access'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Joined community successfully!');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Could not join community.';
      toast.error(message);
    },
  });
}
