'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export interface AccessibleCommunity {
  id: string;
  name: string;
  type: 'SCHOOL' | 'WOREDA' | 'ZONE' | 'REGION' | 'NATIONAL';
  school?: string | null;
  woreda?: string | null;
  zone?: string | null;
  region?: string | null;
  description?: string | null;
  _count: { communityMembers: number; posts: number };
}

export interface AccessibleCommunitiesResponse {
  teacherLevel: string;
  communities: AccessibleCommunity[];
  unlockedTypes: string[];
}

async function fetchAccessibleCommunities(): Promise<AccessibleCommunitiesResponse> {
  const { data } = await api.get<AccessibleCommunitiesResponse>('/community/accessible');
  return data;
}

export function useAccessibleCommunities() {
  const { token, isInitializing } = useAuth();

  return useQuery<AccessibleCommunitiesResponse>({
    queryKey: ['accessible-communities'],
    queryFn: fetchAccessibleCommunities,
    enabled: !isInitializing && !!token,
    staleTime: 60_000,
    retry: 1,
  });
}
