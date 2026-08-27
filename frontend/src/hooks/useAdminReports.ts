import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminReports,
  warnUserReport,
  removeReportContent,
  resolveReport,
  dismissReport,
} from "@/services/admin";

export const ADMIN_REPORTS_KEY = "admin-reports";

export function useAdminReports(query?: any) {
  return useQuery({
    queryKey: [ADMIN_REPORTS_KEY, query],
    queryFn: () => getAdminReports(query),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  const warnMutation = useMutation({
    mutationFn: (reportId: string) => warnUserReport(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] }),
  });

  const removeMutation = useMutation({
    mutationFn: (reportId: string) => removeReportContent(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (reportId: string) => resolveReport(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] }),
  });

  const dismissMutation = useMutation({
    mutationFn: (reportId: string) => dismissReport(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_REPORTS_KEY] }),
  });

  return { warnMutation, removeMutation, resolveMutation, dismissMutation };
}
