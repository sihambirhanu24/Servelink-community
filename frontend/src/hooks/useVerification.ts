import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface VerificationDocument {
  id: string;
  teacherId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface VerificationStatus {
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  approvedAt: string | null;
  documents: VerificationDocument[];
}

export function useVerification() {
  const queryClient = useQueryClient();

  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery<VerificationStatus>({
    queryKey: ["verification-status"],
    queryFn: async () => {
      const response = await api.get("/verification/status");
      return response.data;
    },
    retry: 1,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      documentType,
    }: {
      file: File;
      documentType: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await api.post("/verification/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.delete(`/verification/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
    },
  });

  // Resubmit verification mutation
  const resubmitMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/verification/resubmit");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
    },
  });

  // Submit verification setup information mutation
  const setupMutation = useMutation({
    mutationFn: async (setupData: Record<string, unknown>) => {
      const response = await api.patch("/verification/setup", setupData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const uploadDocument = async (file: File, documentType: string) => {
    return uploadMutation.mutateAsync({ file, documentType });
  };

  const deleteDocument = async (documentId: string) => {
    return deleteMutation.mutateAsync(documentId);
  };

  const resubmit = async () => {
    return resubmitMutation.mutateAsync();
  };

  const submitVerificationSetup = async (setupData: Record<string, unknown>) => {
    return setupMutation.mutateAsync(setupData);
  };

  return {
    status: status,
    documents: status?.documents || [],
    isLoading,
    error,
    refetch,
    uploadDocument,
    isUploading: uploadMutation.isPending,
    deleteDocument,
    isDeleting: deleteMutation.isPending,
    resubmit,
    isResubmitting: resubmitMutation.isPending,
    submitVerificationSetup,
    isSubmittingSetup: setupMutation.isPending,
  };
}
