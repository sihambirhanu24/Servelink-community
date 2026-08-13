import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  upgradeTeacher,
} from "@/services/admin";

export function useUpgradeTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, ...dto }: any) =>
      upgradeTeacher(teacherId, dto.level),

    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({
        queryKey: ["teacher", teacherId],
      });

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },
  });
}