'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCommunitiesByType,
  getPostsByType,
  getMembersByType,
  fetchMembersByType,
  type CommunityTypeResponse,
  type CommunityTypePost,
  type CommunityTypeMemberRow,
} from '@/services/community';

export function useCommunityType(type: string) {
  return useQuery<CommunityTypeResponse>({
    queryKey: ['community-type', type],
    queryFn: () => getCommunitiesByType(type),
    staleTime: 60_000,
    retry: 1,
    enabled: !!type,
  });
}

export function useCommunityTypePosts(
  type: string,
  params?: { search?: string; categoryId?: string; filter?: string; page?: number },
) {
  return useQuery<CommunityTypePost[]>({
    queryKey: ['community-type-posts', type, params],
    queryFn: () => getPostsByType(type, { ...params, limit: 20 }),
    staleTime: 30_000,
    retry: 1,
    enabled: !!type,
  });
}

export function useCommunityTypeMembers(type: string, page: number = 1, search: string = "") {
  return useQuery({
    queryKey: ['community-type-members', type, page, search],
    queryFn: () => fetchMembersByType(type, { page, limit: 10, search }),
    staleTime: 60_000,
    retry: 1,
    enabled: !!type,
  });
}
