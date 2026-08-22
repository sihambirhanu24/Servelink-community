import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminReports, warnUserReport, removeReportContent } from "@/services/admin";

export function useAdminReports(query?: any) {
  return useQuery({
    queryKey: ["admin-reports", query],
    queryFn: () => getAdminReports(query),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  const warnMutation = useMutation({
    mutationFn: (reportId: string) => warnUserReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (reportId: string) => removeReportContent(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  return { warnMutation, removeMutation };
}
