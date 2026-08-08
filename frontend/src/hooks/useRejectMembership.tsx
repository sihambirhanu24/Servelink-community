import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  rejectMembership,
} from "@/services/admin.service";

export function useRejectMembership() {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: rejectMembership,

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["membershipRequests"],
      });

    },

  });

}