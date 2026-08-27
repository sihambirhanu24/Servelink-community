import { useQuery } from "@tanstack/react-query";
import { CommunityService } from "@/services/community.service";
import { useAuth } from "@/context/AuthContext";

export function usePosts() {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } = await CommunityService.getPosts();
      return data;
    },
    enabled: !isInitializing && !!token,
  });
}