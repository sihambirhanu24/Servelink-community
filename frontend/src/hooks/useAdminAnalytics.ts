import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/services/admin";

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminDashboard,
  });
}

export function useTeacherGrowth() {
  return useQuery({
    queryKey: ["teacher-growth"],
    queryFn: getAdminDashboard,
  });
}

export function useCommunityCategories() {
  return useQuery({
    queryKey: ["community-categories"],
    queryFn: () => import('@/services/admin').then(m => m.getAdminTeachers()),
  });
}
