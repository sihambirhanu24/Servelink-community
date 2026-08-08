import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  likePost,
  unlikePost,
} from "@/services/community";

export function useLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      liked,
    }: {
      id: string;
      liked: boolean;
    }) =>
      liked
        ? unlikePost(id)
        : likePost(id),

    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}