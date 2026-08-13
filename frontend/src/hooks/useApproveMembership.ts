import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveMembership,
} from "@/services/admin";

export function useApproveMembership() {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: approveMembership,

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["membershipRequests"],
      });

    },

  });

}