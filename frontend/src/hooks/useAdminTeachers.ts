import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/services/admin';
import { TeachersQuery } from '@/services/admin';

export function useAdminTeachers(query: TeachersQuery) {
  return useQuery({
    queryKey: ['admin', 'teachers', query],
    queryFn: () => adminApi.fetchTeachers(query),
    // keepPreviousData-style behavior: when `query` changes (e.g. page
    // 1 -> page 2), React Query would normally show a loading spinner
    // while refetching. placeholderData preserves the OLD page's data
    // on screen while the new page loads in the background — no flash
    // to empty/loading between pages.
    placeholderData: (previousData) => previousData,
  });
}

export function useSuspendTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendTeacher(id),
    // OPTIMISTIC UPDATE, as required by the spec: instead of waiting
    // for the server to respond before updating the UI, we update the
    // cached table data immediately, THEN send the request. If the
    // request fails, onError rolls it back. This makes the table feel
    // instant instead of waiting ~200ms+ for a round trip on every click.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'teachers'] });
      const previous = queryClient.getQueriesData({ queryKey: ['admin', 'teachers'] });

      queryClient.setQueriesData({ queryKey: ['admin', 'teachers'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t: any) => (t.id === id ? { ...t, status: 'SUSPENDED' } : t)),
        };
      });

      return { previous };
    },
    onError: (_err, _id, context) => {
      // Roll back to the exact snapshot taken in onMutate — this is
      // why we saved `previous` above rather than just refetching on
      // error, which would show a loading flash before correcting itself.
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Whether it succeeded or failed, re-sync with the server once
      // to guarantee the cache matches reality (e.g. in case another
      // admin changed the same teacher concurrently).
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
    },
  });
}

export function useActivateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.activateTeacher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] }),
  });
}

export function usePromoteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, level }: { id: string; level: string }) => adminApi.promoteTeacher(id, level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] }),
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTeacher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] }),
  });
}
