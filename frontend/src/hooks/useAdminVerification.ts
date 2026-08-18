import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface PendingTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  woreda: string;
  zone: string;
  region: string;
  department: string | null;
  subject: string | null;
  createdAt: string;
  verificationDocuments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
}

export interface TeacherVerificationDetails extends PendingTeacher {
  verificationStatus: string;
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
}

export function useAdminVerification() {
  const queryClient = useQueryClient();

  // Fetch pending teachers
  const {
    data: pendingTeachers,
    isLoading,
    error,
    refetch,
  } = useQuery<PendingTeacher[]>({
    queryKey: ["admin-pending-verification"],
    queryFn: async () => {
      const response = await api.get("/admin/teachers/pending-verification");
      return response.data;
    },
  });

  // Fetch teacher verification details
  const fetchTeacherDetails = async (teacherId: string) => {
    const response = await api.get<TeacherVerificationDetails>(
      `/admin/teachers/${teacherId}/verification`
    );
    return response.data;
  };

  // Approve teacher mutation
  const approveMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const response = await api.patch(
        `/admin/teachers/${teacherId}/approve-verification`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-verification"] });
    },
  });

  // Reject teacher mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      teacherId,
      reason,
    }: {
      teacherId: string;
      reason: string;
    }) => {
      const response = await api.patch(
        `/admin/teachers/${teacherId}/reject-verification`,
        { reason }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-verification"] });
    },
  });

  const approveTeacher = async (teacherId: string) => {
    return approveMutation.mutateAsync(teacherId);
  };

  const rejectTeacher = async (teacherId: string, reason: string) => {
    return rejectMutation.mutateAsync({ teacherId, reason });
  };

  const viewDocument = (teacherId: string, documentId: string) => {
    // Open document in new tab
    const token = localStorage.getItem("token");
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/teachers/${teacherId}/documents/${documentId}`,
      "_blank"
    );
  };

  return {
    pendingTeachers: pendingTeachers || [],
    isLoading,
    error,
    refetch,
    fetchTeacherDetails,
    approveTeacher,
    isApproving: approveMutation.isPending,
    rejectTeacher,
    isRejecting: rejectMutation.isPending,
    viewDocument,
  };
}
