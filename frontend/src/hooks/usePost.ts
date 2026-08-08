import { useQuery } from "@tanstack/react-query";
import { CommunityService } from "@/services/community.service";

export function usePost(id: string) {
  return useQuery({
    queryKey: ["post", id],

    queryFn: async () => {
      const { data } =
        await CommunityService.getPost(id);

      return data;
    },
  });
}