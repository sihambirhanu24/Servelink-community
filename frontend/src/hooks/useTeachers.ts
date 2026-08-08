import { useQuery } from "@tanstack/react-query";
import { getTeachers } from "@/services/admin.service";

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });
}