import { useQuery } from "@tanstack/react-query";
import { getAdminTeachers } from "@/services/admin";

export function useTeachers(query?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
  teacherLevel?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["teachers", query],
    queryFn: () => getAdminTeachers(query),
  });
}