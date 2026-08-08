import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/services/admin";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });
}