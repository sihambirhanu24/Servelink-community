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

// ============ TEACHER VERIFICATION ============
export async function approveTeacherVerification(teacherId: string) {
  const { data } = await adminApi.patch(`/admin/teachers/${teacherId}/approve-verification`);
  return data;
}

export async function rejectTeacherVerification(teacherId: string, reason: string) {
  const { data } = await adminApi.patch(`/admin/teachers/${teacherId}/reject-verification`, {
    reason,
  });
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

export async function createCategory(name: string) {
  const { data } = await adminApi.post("/community/categories", { name });
  return data;
}

export async function deleteCategory(categoryId: string) {
  const { data } = await adminApi.delete(`/community/categories/${categoryId}`);
  return data;
}

// ============ COMMUNITIES ============
export async function createCommunity(communityData: {
  name: string;
  description: string;
  type: string;
  subtype?: string;
  isActive?: boolean;
}) {
  const { data } = await adminApi.post("/admin/communities", communityData);
  return data;
}

export async function getAdminCommunities(query?: any) {
  const { data } = await adminApi.get("/admin/communities", { params: query });
  return data;
}

export async function toggleCommunityActive(communityId: string) {
  const { data } = await adminApi.patch(`/admin/communities/${communityId}/toggle-active`);
  return data;
}
