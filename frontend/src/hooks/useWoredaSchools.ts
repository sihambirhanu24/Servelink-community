'use client';

import { useQuery } from '@tanstack/react-query';
import { getWoredaSchools } from '@/services/community';
import type { WoredaSchoolsResponse } from '@/services/community';

export function useWoredaSchools() {
  return useQuery<WoredaSchoolsResponse>({
    queryKey: ['woreda-schools'],
    queryFn: getWoredaSchools,
    staleTime: 60_000,
    retry: 1,
  });
}
