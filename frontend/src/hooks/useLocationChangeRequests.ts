import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useLocationChangeRequests() {
  return useQuery({
    queryKey: ['location-change-requests', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/location-change-requests/my');
      return data;
    },
  });
}

export function useSubmitLocationChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/location-change-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-change-requests', 'my'] });
    },
  });
}
