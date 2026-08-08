import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unlikePost } from "@/services/community.service";

export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlikePost,

    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}