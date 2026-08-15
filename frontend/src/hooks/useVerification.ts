import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveTeacher,
  getMyVerification,
  getPendingTeachers,
  getTeacherVerification,
  rejectTeacher,
  resubmitVerification,
} from "@/services/verification";
import type { VerificationDocumentValue } from "@/lib/auth-schemas";

/* ─── Teacher-facing ──────────────────────────────────────────────────── */

export function useMyVerification(enabled = true) {
  return useQuery({
    queryKey: ["my-verification"],
    queryFn: getMyVerification,
    enabled,
  });
}

export function useResubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documents: VerificationDocumentValue[]) =>
      resubmitVerification(documents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-verification"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

/* ─── Admin-facing ────────────────────────────────────────────────────── */

export function usePendingTeachers(query?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["pending-teachers", query],
    queryFn: () => getPendingTeachers(query),
  });
}

export function useTeacherVerification(teacherId?: string) {
  return useQuery({
    queryKey: ["teacher-verification", teacherId],
    queryFn: () => getTeacherVerification(teacherId as string),
    enabled: !!teacherId,
  });
}

export function useApproveTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherId: string) => approveTeacher(teacherId),
    onSuccess: (_data, teacherId) => {
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-verification", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

export function useRejectTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, reason }: { teacherId: string; reason: string }) =>
      rejectTeacher(teacherId, reason),
    onSuccess: (_data, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-verification", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
