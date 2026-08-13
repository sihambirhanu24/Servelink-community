import { useQuery } from "@tanstack/react-query";
import { getAdminTeachers } from "@/services/admin";

export function useTeacherLevels() {
  return useQuery({
    queryKey: ["teacher-levels"],
    queryFn: () => getAdminTeachers(), // Teacher levels are included in teacher data
    staleTime: 60_000,
  });
}
