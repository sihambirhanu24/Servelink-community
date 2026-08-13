import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportPost } from "@/services/community";

export function useReportPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { postId: string; reason: string; description?: string }) =>
      reportPost(data.postId, {
        reason: data.reason as any,
        description: data.description,
      }),
    onSuccess: () => {
      // Invalidate any post-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
}
