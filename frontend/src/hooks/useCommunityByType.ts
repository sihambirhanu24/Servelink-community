import { useQuery } from '@tanstack/react-query';
import * as communityTypeApi from '@/services/community-type';

export function useMyCommunityByType(type: string) {
  return useQuery({
    queryKey: ['community', 'type', type],
    queryFn: () => communityTypeApi.fetchMyCommunityByType(type),
    retry: false, // 403 (level) / 404 (no matching community name) are meaningful, not transient
  });
}

export function usePostsByType(type: string, filters: { search?: string; categoryId?: string; filter?: string }) {
  return useQuery({
    queryKey: ['community', 'type', type, 'posts', filters],
    queryFn: () => communityTypeApi.fetchPostsByType(type, { ...filters, page: 1, limit: 20 }),
  });
}

export function useMembersByType(type: string) {
  return useQuery({
    queryKey: ['community', 'type', type, 'members'],
    queryFn: () => communityTypeApi.fetchMembersByType(type),
  });
}
