import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/services/profile";

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  subject?: string;
  school?: string;
  woreda?: string;
  zone?: string;
  region?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
