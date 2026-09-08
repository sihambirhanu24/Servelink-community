import { adminApi } from "@/lib/axios";
import type {
  AdminDashboardData,
  SuspensionHistoryItem,
  SuspensionType,
  Teacher,
  TeacherStatus,
  TeachersResponse,
} from "@/types/admin";

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await adminApi.get<AdminDashboardData>("/admin/dashboard");
  return data;
}

export async function getAdminTeachers(query?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TeacherStatus;
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

// ============ TEACHER SUSPENSION ============
// All of these hit SuspensionService on the backend: the authoritative
// Teacher.status is updated inside a transaction together with a
// SuspensionHistory record, and every subsequent request made with the
// teacher's existing JWT is rejected with 403 ACCOUNT_SUSPENDED.

export interface SuspendTeacherInput {
  suspensionType: SuspensionType;
  reason: string;
  /** Required for TEMPORARY suspensions. */
  durationDays?: number;
  reportId?: string;
}

export async function suspendTeacher(teacherId: string, input: SuspendTeacherInput): Promise<Teacher> {
  const { data } = await adminApi.patch<Teacher>(`/admin/teachers/${teacherId}/suspend`, input);
  return data;
}

export async function activateTeacher(teacherId: string, reason?: string): Promise<Teacher> {
  const { data } = await adminApi.patch<Teacher>(`/admin/teachers/${teacherId}/activate`, reason ? { reason } : {});
  return data;
}

export async function getTeacherSuspensionHistory(teacherId: string): Promise<SuspensionHistoryItem[]> {
  const { data } = await adminApi.get<SuspensionHistoryItem[]>(`/admin/teachers/${teacherId}/suspension-history`);
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
// Prefer the typed helpers/hooks in services/admin-posts.ts; kept for backwards compatibility.
export async function getAdminPosts(query?: any) {
  const { data } = await adminApi.get("/admin/posts", { params: query });
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

// ============ REPORTS ============
export async function getAdminReports(query?: any) {
  const { data } = await adminApi.get("/admin/reports", { params: query });
  return data;
}

export async function warnUserReport(reportId: string) {
  const { data } = await adminApi.post(`/admin/reports/${reportId}/warn`);
  return data;
}

export async function removeReportContent(reportId: string) {
  const { data } = await adminApi.post(`/admin/reports/${reportId}/remove-content`);
  return data;
}

export async function resolveReport(reportId: string) {
  const { data } = await adminApi.patch(`/admin/reports/${reportId}/resolve`);
  return data;
}

export async function dismissReport(reportId: string) {
  const { data } = await adminApi.patch(`/admin/reports/${reportId}/dismiss`);
  return data;
}
