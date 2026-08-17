import { useQuery } from "@tanstack/react-query";
import { progressService } from "@/services/progress";

/**
 * Hook to fetch and display teacher's progression status
 */
export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: progressService.getProgress,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch teacher's activity history
 */
export function useActivityHistory() {
  return useQuery({
    queryKey: ["progress", "activity"],
    queryFn: progressService.getActivityHistory,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
}
