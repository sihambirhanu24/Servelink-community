import { useQuery } from "@tanstack/react-query";
import { CommunityService } from "@/services/community.service";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } =
        await CommunityService.getPosts();

      return data;
    },
  });
}