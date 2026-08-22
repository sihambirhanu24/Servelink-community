import { useQuery } from "@tanstack/react-query";
import { getTeacherPosts, type TeacherPostsResponse } from "@/services/teachers";

export function useTeacherPosts(teacherId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["teacher-posts", teacherId, page, limit],
    queryFn: () => getTeacherPosts(teacherId, page, limit),
    enabled: !!teacherId,
  });
}
