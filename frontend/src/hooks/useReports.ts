import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  getAdminReports,
  resolveReport,
  dismissReport,
  warnUserReport,
  removeReportContent,
} from '@/services/admin';

export const ADMIN_REPORTS_KEY = 'admin-reports';

// ─── Teacher: report a post ───────────────────────────────────────────────────

export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, reason, description }: {
      postId: string;
      reason: string;
      description?: string;
    }) =>
      api.post(`/community/posts/${postId}/report`, { reason, description })
        .then((r) => r.data),
  });
}

// ─── Admin: fetch reports ─────────────────────────────────────────────────────

export function useAdminReports(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  reason?: string;
}) {
  return useQuery({
    queryKey: [ADMIN_REPORTS_KEY, params],
    queryFn: () => getAdminReports(params),
    staleTime: 30_000,
  });
}

// ─── Admin: resolve a report (action taken) ───────────────────────────────────

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => resolveReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] });
    },
  });
}

// ─── Admin: dismiss a report (no action) ─────────────────────────────────────

export function useDismissReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => dismissReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] });
    },
  });
}

// ─── Admin: warn the post owner ──────────────────────────────────────────────

export function useWarnUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => warnUserReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] });
    },
  });
}

// ─── Admin: remove reported content ──────────────────────────────────────────

export function useRemoveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => removeReportContent(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] });
    },
  });
}
