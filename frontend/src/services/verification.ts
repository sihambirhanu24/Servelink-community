import api, { adminApi } from "@/lib/axios";
import type { VerificationDocumentValue } from "@/lib/auth-schemas";

export type TeacherVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TeacherVerificationDocument {
  id: string;
  documentType: "TEACHER_ID" | "EMPLOYMENT_LETTER" | "CERTIFICATE" | "OTHER";
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  archivedAt: string | null;
}

export interface TeacherVerification {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  department: string | null;
  subject: string | null;
  teacherIdNumber: string | null;
  level: string;
  verificationStatus: TeacherVerificationStatus;
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  verificationDocuments: TeacherVerificationDocument[];
}

export interface PendingTeachersResponse {
  data: TeacherVerification[];
  meta: { total: number; page: number; pageSize: number };
}

/* ─── Teacher-facing ──────────────────────────────────────────────────── */

export async function getMyVerification(): Promise<TeacherVerification> {
  const { data } = await api.get("/teacher/verification");
  return data;
}

export async function resubmitVerification(
  documents: VerificationDocumentValue[],
): Promise<TeacherVerification> {
  const formData = new FormData();
  documents.forEach(({ file, documentType }) => {
    formData.append("documents", file);
    formData.append("documentTypes", documentType);
  });

  const { data } = await api.post("/teacher/verification/resubmit", formData);
  return data;
}

/* ─── Admin-facing ────────────────────────────────────────────────────── */

export async function getPendingTeachers(query?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PendingTeachersResponse> {
  const { data } = await adminApi.get("/admin/teachers/pending", { params: query });
  return data;
}

export async function getTeacherVerification(
  teacherId: string,
): Promise<TeacherVerification> {
  const { data } = await adminApi.get(`/admin/teachers/${teacherId}/verification`);
  return data;
}

/**
 * Verification documents are private, so they are fetched with the admin
 * bearer token and handed to the browser as a short-lived object URL rather
 * than a public link.
 */
export async function getVerificationDocumentUrl(
  teacherId: string,
  documentId: string,
): Promise<string> {
  const { data } = await adminApi.get(
    `/admin/teachers/${teacherId}/verification-documents/${documentId}`,
    { responseType: "blob" },
  );
  return URL.createObjectURL(data as Blob);
}

export async function approveTeacher(teacherId: string) {
  const { data } = await adminApi.patch(`/admin/teachers/${teacherId}/approve`);
  return data;
}

export async function rejectTeacher(teacherId: string, reason: string) {
  const { data } = await adminApi.patch(`/admin/teachers/${teacherId}/reject`, {
    reason,
  });
  return data;
}
