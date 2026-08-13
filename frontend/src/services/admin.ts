import { adminApi } from "@/lib/axios";
import type { AdminDashboardData, TeachersResponse } from "@/types/admin";

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await adminApi.get<AdminDashboardData>("/admin/dashboard");
  return data;
}

export async function getAdminTeachers(query?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
  teacherLevel?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<TeachersResponse> {
  const { data } = await adminApi.get<TeachersResponse>("/admin/teachers", { params: query });
  return data;
}

export async function upgradeTeacher(teacherId: string, level: string) {
  const { data } = await adminApi.patch("/admin/teachers/upgrade-level", {
    teacherId,
    level,
  });
  return data;
}

export async function suspendTeacher(teacherId: string) {
  const { data } = await adminApi.patch(`/admin/teachers/${teacherId}/suspend`);
  return data;
}

export async function activateTeacher(teacherId: string) {
  const { data } = await adminApi.patch(`/admin/teachers/${teacherId}/activate`);
  return data;
}

// ============ MEMBERSHIP REQUESTS ============
export async function getMembershipRequests() {
  const { data } = await adminApi.get("/admin/memberships");
  return data;
}

export async function approveMembership(id: string) {
  const { data } = await adminApi.patch(`/admin/memberships/${id}/approve`);
  return data;
}

export async function rejectMembership(id: string) {
  const { data } = await adminApi.patch(`/admin/memberships/${id}/reject`);
  return data;
}

// ============ POSTS ============
export async function getAdminPosts(query?: any) {
  const { data } = await adminApi.get("/posts", { params: query });
  return data;
}

export async function deleteAdminPost(id: string) {
  const { data } = await adminApi.delete(`/community/posts/${id}`);
  return data;
}

// ============ CATEGORIES ============
export async function getAdminCategories(query?: any) {
  const { data } = await adminApi.get("/community/categories", { params: query });
  return data;
}
