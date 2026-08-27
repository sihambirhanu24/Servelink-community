import { useQuery } from "@tanstack/react-query";
import { progressService } from "@/services/progress";
import { useAuth } from "@/context/AuthContext";

export function useProgress() {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: ["progress"],
    queryFn: progressService.getProgress,
    enabled: !isInitializing && !!token,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useActivityHistory() {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: ["progress", "activity"],
    queryFn: () => progressService.getActivityHistory(),
    enabled: !isInitializing && !!token,
    staleTime: 1000 * 60 * 2,
  });
}
