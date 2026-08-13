import { useQuery } from "@tanstack/react-query";
import { getAdminPosts } from "@/services/admin";

// Reports are actually posts with reporting data
// Using posts endpoint and filtering for reported content
export function useAdminReports(query?: any) {
  return useQuery({
    queryKey: ["admin-reports", query],
    queryFn: () => getAdminPosts({ ...query, reported: true }),
  });
}
