import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/services/comment.service";

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,

    onSuccess(_, variables) {
      queryClient.invalidateQueries({
        queryKey: ["post-comments", variables.postId],
      });

      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });

      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}