import { useQuery } from "@tanstack/react-query";
import { getAdminPosts } from "@/services/admin";

export function useAdminPosts(query?: any) {
  return useQuery({
    queryKey: ["admin-posts", query],
    queryFn: () => getAdminPosts(query),
  });
}
