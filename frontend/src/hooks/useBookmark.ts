import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  bookmarkPost,
  removeBookmark,
} from "@/services/community";

export function useBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      bookmarked,
    }: {
      id: string;
      bookmarked: boolean;
    }) =>
      bookmarked
        ? removeBookmark(id)
        : bookmarkPost(id),

    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}