import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminGetAnnouncements,
  adminGetAnnouncement,
  adminGetAnnouncementSummary,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminDeleteAnnouncement,
  adminPublishAnnouncement,
  adminUnpublishAnnouncement,
  getAnnouncements,
  getAnnouncement,
  markAnnouncementRead,
  type CreateAnnouncementPayload,
  type UpdateAnnouncementPayload,
} from '@/services/announcements';

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useAdminAnnouncements(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin-announcements', params],
    queryFn: () => adminGetAnnouncements(params),
  });
}

export function useAdminAnnouncement(id: string | null) {
  return useQuery({
    queryKey: ['admin-announcement', id],
    queryFn: () => adminGetAnnouncement(id!),
    enabled: !!id,
  });
}

export function useAdminAnnouncementSummary() {
  return useQuery({
    queryKey: ['admin-announcement-summary'],
    queryFn: adminGetAnnouncementSummary,
    staleTime: 60_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => adminCreateAnnouncement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      qc.invalidateQueries({ queryKey: ['admin-announcement-summary'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAnnouncementPayload }) =>
      adminUpdateAnnouncement(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      qc.invalidateQueries({ queryKey: ['admin-announcement', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin-announcement-summary'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      qc.invalidateQueries({ queryKey: ['admin-announcement-summary'] });
    },
  });
}

export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminPublishAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      qc.invalidateQueries({ queryKey: ['admin-announcement-summary'] });
    },
  });
}

export function useUnpublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminUnpublishAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      qc.invalidateQueries({ queryKey: ['admin-announcement-summary'] });
    },
  });
}

// ─── Teacher hooks ────────────────────────────────────────────────────────────

export function useTeacherAnnouncements(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: () => getAnnouncements(params),
    staleTime: 60_000,
  });
}

export function useTeacherAnnouncement(id: string | null) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: () => getAnnouncement(id!),
    enabled: !!id,
  });
}

export function useMarkAnnouncementRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAnnouncementRead(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });
}
