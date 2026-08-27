import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useAvailableSchools() {
  return useQuery({
    queryKey: ['available-schools'],
    queryFn: async () => {
      const { data } = await api.get('/location-change-requests/schools');
      return data as { school: string; woreda: string; zone: string; region: string }[];
    },
  });
}
