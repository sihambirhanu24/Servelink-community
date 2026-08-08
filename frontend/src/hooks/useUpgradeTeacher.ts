import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  upgradeTeacher,
} from "@/services/admin.service";

export function useUpgradeTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherId: string) =>
      upgradeTeacher(teacherId),

    onSuccess: (_, teacherId) => {
      queryClient.invalidateQueries({
        queryKey: ["teacher", teacherId],
      });

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },
  });
}