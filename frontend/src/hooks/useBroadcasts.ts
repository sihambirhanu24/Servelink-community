import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/services/notification";

export function useBroadcasts(query?: any) {
  return useQuery({
    queryKey: ["admin-broadcasts", query],
    queryFn: () => fetchNotifications({ ...query }),
    staleTime: 30_000,
  });
}
