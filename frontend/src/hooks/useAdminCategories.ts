import { useQuery } from "@tanstack/react-query";
import { getAdminCategories } from "@/services/admin";

export function useAdminCategories(query?: any) {
  return useQuery({
    queryKey: ["admin-categories", query],
    queryFn: () => getAdminCategories(query),
  });
}
