import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/auth";

export function useTeacher(teacherId?: string) {
  return useQuery({
    queryKey: teacherId ? ["teacher", teacherId] : ["teacher"],
    queryFn: async () => {
      const teacher = await getCurrentUser();

      if (teacherId && teacher?.id !== teacherId) {
        return teacher;
      }

      return {
        ...teacher,
        profile: teacher,
        statistics: {
          posts: teacher?.postsCount ?? 0,
          likes: teacher?.likesCount ?? 0,
          comments: teacher?.commentsCount ?? 0,
          bookmarks: teacher?.bookmarksCount ?? 0,
          communities: teacher?.communitiesCount ?? 0,
        },
      };
    },
  });
}