import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeacherProfile, followTeacher, unfollowTeacher, type TeacherProfile, type FollowResponse } from "@/services/teachers";
import { useAuth } from "@/context/AuthContext";

export function useTeacherProfile(teacherId: string) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  return useQuery({
    queryKey: ["teacher-profile", teacherId],
    queryFn: () => getTeacherProfile(teacherId),
    enabled: !!teacherId,
  });
}

export function useFollowTeacher(teacherId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const followMutation = useMutation({
    mutationFn: () => followTeacher(teacherId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["teacher-profile", teacherId] });
      
      const previousProfile = queryClient.getQueryData<TeacherProfile>(["teacher-profile", teacherId]);
      
      queryClient.setQueryData<TeacherProfile>(["teacher-profile", teacherId], (old) => {
        if (!old) return old;
        return {
          ...old,
          followerCount: old.followerCount + 1,
          isFollowedByCurrentUser: true,
        };
      });

      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["teacher-profile", teacherId], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile", teacherId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowTeacher(teacherId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["teacher-profile", teacherId] });
      
      const previousProfile = queryClient.getQueryData<TeacherProfile>(["teacher-profile", teacherId]);
      
      queryClient.setQueryData<TeacherProfile>(["teacher-profile", teacherId], (old) => {
        if (!old) return old;
        return {
          ...old,
          followerCount: Math.max(0, old.followerCount - 1),
          isFollowedByCurrentUser: false,
        };
      });

      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["teacher-profile", teacherId], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile", teacherId] });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending || unfollowMutation.isPending,
  };
}
