import api from '@/lib/axios';
import { adminApi } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnouncementType =
  | 'GENERAL'
  | 'IMPORTANT'
  | 'URGENT'
  | 'COMMUNITY_UPDATE'
  | 'SYSTEM_UPDATE';

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED';

export type AnnouncementTarget =
  | 'ALL_TEACHERS'
  | 'SCHOOL'
  | 'WOREDA'
  | 'ZONE'
  | 'REGION'
  | 'NATIONAL';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  targetAudience: AnnouncementTarget;
  communityId: string | null;
  community?: { id: string; name: string; type: string } | null;
  createdById: string;
  createdByName: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // teacher-facing extras
  isRead?: boolean;
  readAt?: string | null;
  // admin extras
  _count?: { reads: number };
}

export interface AnnouncementListResponse {
  data: Announcement[];
  meta: { total: number; page: number; pageSize?: number; limit?: number; totalPages: number };
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  type?: AnnouncementType;
  targetAudience?: AnnouncementTarget;
  communityId?: string;
  file?: File | null;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  targetAudience?: AnnouncementTarget;
  communityId?: string;
  file?: File | null;
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export async function adminGetAnnouncements(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}): Promise<AnnouncementListResponse> {
  const { data } = await adminApi.get('/admin/announcements', { params });
  return data;
}

export async function adminGetAnnouncement(id: string): Promise<Announcement> {
  const { data } = await adminApi.get(`/admin/announcements/${id}`);
  return data;
}

export async function adminGetAnnouncementSummary(): Promise<{
  published: number;
  draft: number;
  recent: Announcement[];
}> {
  const { data } = await adminApi.get('/admin/announcements/summary');
  return data;
}

export async function adminCreateAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<Announcement> {
  const form = new FormData();
  form.append('title',   payload.title);
  form.append('content', payload.content);
  if (payload.type)           form.append('type',           payload.type);
  if (payload.targetAudience) form.append('targetAudience', payload.targetAudience);
  if (payload.communityId)    form.append('communityId',    payload.communityId);
  if (payload.file)           form.append('file',           payload.file);

  const { data } = await adminApi.post('/admin/announcements', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function adminUpdateAnnouncement(
  id: string,
  payload: UpdateAnnouncementPayload,
): Promise<Announcement> {
  const form = new FormData();
  if (payload.title          !== undefined) form.append('title',           payload.title!);
  if (payload.content        !== undefined) form.append('content',         payload.content!);
  if (payload.type           !== undefined) form.append('type',            payload.type!);
  if (payload.targetAudience !== undefined) form.append('targetAudience',  payload.targetAudience!);
  if (payload.communityId    !== undefined) form.append('communityId',     payload.communityId!);
  if (payload.file)                         form.append('file',            payload.file);

  const { data } = await adminApi.patch(`/admin/announcements/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function adminDeleteAnnouncement(id: string): Promise<{ message: string }> {
  const { data } = await adminApi.delete(`/admin/announcements/${id}`);
  return data;
}

export async function adminPublishAnnouncement(id: string): Promise<Announcement> {
  const { data } = await adminApi.patch(`/admin/announcements/${id}/publish`);
  return data;
}

export async function adminUnpublishAnnouncement(id: string): Promise<Announcement> {
  const { data } = await adminApi.patch(`/admin/announcements/${id}/unpublish`);
  return data;
}

// ─── Teacher API ──────────────────────────────────────────────────────────────

export async function getAnnouncements(params?: {
  page?: number;
  limit?: number;
}): Promise<AnnouncementListResponse> {
  const { data } = await api.get('/announcements', { params });
  return data;
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  const { data } = await api.get(`/announcements/${id}`);
  return data;
}

export async function markAnnouncementRead(id: string): Promise<{ read: boolean }> {
  const { data } = await api.post(`/announcements/${id}/read`);
  return data;
}
