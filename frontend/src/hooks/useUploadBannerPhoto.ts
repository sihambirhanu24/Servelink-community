import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadBannerPhoto } from "@/services/profile";

export function useUploadBannerPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadBannerPhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
