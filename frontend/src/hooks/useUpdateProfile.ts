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
  department?: string;
  // Personal
  gender?: string;
  bio?: string;
  phone?: string;
  // Professional
  profession?: string;
  specialization?: string;
  skills?: string;
  gradeLevel?: string;
  yearsOfExperience?: number;
  // School
  schoolType?: string;
  city?: string;
  schoolLocation?: string;
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
