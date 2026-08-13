'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminDashboard, getAdminTeachers, suspendTeacher, activateTeacher, upgradeTeacher } from "@/services/admin";

export const ADMIN_DASHBOARD_KEY = "admin-dashboard";
export const ADMIN_TEACHERS_KEY = "admin-teachers";

export function useAdminDashboard() {
  return useQuery({
    queryKey: [ADMIN_DASHBOARD_KEY],
    queryFn: getAdminDashboard,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAdminTeachers(query?: Parameters<typeof getAdminTeachers>[0]) {
  return useQuery({
    queryKey: [ADMIN_TEACHERS_KEY, query],
    queryFn: () => getAdminTeachers(query),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSuspendTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suspendTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TEACHERS_KEY] });
    },
  });
}

export function useActivateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TEACHERS_KEY] });
    },
  });
}

export function useUpgradeTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, level }: { teacherId: string; level: string }) =>
      upgradeTeacher(teacherId, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TEACHERS_KEY] });
    },
  });
}
