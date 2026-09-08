import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/axios';

// ─── Types (mirror backend/src/admin/dto/admin-posts.dto.ts and Prisma enums) ──

export const POST_TYPES = ['QUESTION', 'DISCUSSION', 'RESOURCE', 'ANNOUNCEMENT'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const MODERATION_STATUSES = ['ACTIVE', 'REPORTED', 'UNDER_REVIEW', 'HIDDEN', 'REMOVED'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const REPORT_FILTERS = ['NO_REPORTS', 'REPORTED', 'UNRESOLVED', 'RESOLVED'] as const;
export type ReportFilter = (typeof REPORT_FILTERS)[number];

export const POST_SORTS = ['newest', 'oldest', 'most_reported', 'most_engaged'] as const;
export type PostSort = (typeof POST_SORTS)[number];

export type ModerationAction = 'HIDDEN' | 'REMOVE' | 'RESTORE';
export type ReportResolution = 'RESOLVE' | 'DISMISS';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
export type ReportReason = 'SPAM' | 'ABUSE' | 'FAKE_INFORMATION' | 'OTHER' | 'HARASSMENT' | 'MISINFORMATION';

export interface AdminPostsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  communityId?: string;
  moderationStatus?: ModerationStatus;
  postType?: PostType;
  reportStatus?: ReportFilter;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: PostSort;
}

export interface AdminPostRow {
  id: string;
  title: string;
  preview: string;
  postType: PostType;
  moderationStatus: ModerationStatus;
  moderatedAt: string | null;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  pendingReports: number;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level: string;
    verified: boolean;
    status: string;
    profileImage: string | null;
  };
  community: { id: string; name: string; type: string };
  category: { id: string; name: string };
  _count: {
    communityLikes: number;
    comments: number;
    communityBookmarks: number;
    communityReports: number;
    attachments: number;
  };
}

export interface AdminPostsResponse {
  data: AdminPostRow[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface AdminPostStats {
  total: number;
  published: number;
  pendingReview: number;
  reported: number;
  underReview: number;
  hidden: number;
  removed: number;
  todayPosts: number;
  pendingReports: number;
  postsWithPendingReports: number;
  byStatus: Record<ModerationStatus, number>;
  byType: Record<PostType, number>;
}

export interface AdminPostReport {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
  };
}

export interface AdminPostReportsResponse {
  post: { id: string; title: string; moderationStatus: ModerationStatus };
  reports: AdminPostReport[];
}

export interface BulkModerateResult {
  action: ModerationAction;
  updated: string[];
  skipped: { id: string; moderationStatus: ModerationStatus }[];
}

export interface CommunityOption {
  id: string;
  name: string;
  type: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function fetchAdminPostStats(): Promise<AdminPostStats> {
  const { data } = await adminApi.get<AdminPostStats>('/admin/posts/stats');
  return data;
}

export async function fetchAdminPosts(query: AdminPostsQuery): Promise<AdminPostsResponse> {
  const { data } = await adminApi.get<AdminPostsResponse>('/admin/posts', { params: query });
  return data;
}

export async function fetchAdminPostReports(postId: string): Promise<AdminPostReportsResponse> {
  const { data } = await adminApi.get<AdminPostReportsResponse>(`/admin/posts/${postId}/reports`);
  return data;
}

export async function moderateAdminPost(postId: string, action: ModerationAction, reason?: string) {
  const { data } = await adminApi.patch(`/admin/posts/${postId}/moderate`, { action, reason });
  return data;
}

export async function bulkModerateAdminPosts(
  ids: string[],
  action: ModerationAction,
  reason?: string,
): Promise<BulkModerateResult> {
  const { data } = await adminApi.patch<BulkModerateResult>('/admin/posts/bulk/moderate', {
    ids,
    action,
    reason,
  });
  return data;
}

export async function resolveAdminPostReport(
  postId: string,
  reportId: string,
  action: ReportResolution,
) {
  const { data } = await adminApi.patch(`/admin/posts/${postId}/reports/${reportId}/resolve`, {
    action,
  });
  return data;
}

export async function fetchCommunityOptions(): Promise<CommunityOption[]> {
  const { data } = await adminApi.get<{ data: CommunityOption[] }>('/admin/communities', {
    params: { page: 1, pageSize: 200 },
  });
  return data.data.map(({ id, name, type }) => ({ id, name, type }));
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const adminPostKeys = {
  all: ['admin-posts'] as const,
  list: (query: AdminPostsQuery) => ['admin-posts', query] as const,
  stats: ['admin-post-stats'] as const,
  reports: (postId: string) => ['admin-post-reports', postId] as const,
  detail: (postId: string) => ['admin-post-detail', postId] as const,
  communities: ['admin-community-options'] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAdminPostStats() {
  return useQuery({ queryKey: adminPostKeys.stats, queryFn: fetchAdminPostStats });
}

export function useAdminPostsList(query: AdminPostsQuery) {
  return useQuery({
    queryKey: adminPostKeys.list(query),
    queryFn: () => fetchAdminPosts(query),
    placeholderData: keepPreviousData,
  });
}

export function useAdminPostReports(postId: string | null) {
  return useQuery({
    queryKey: adminPostKeys.reports(postId ?? ''),
    queryFn: () => fetchAdminPostReports(postId as string),
    enabled: Boolean(postId),
  });
}

export function useCommunityOptions() {
  return useQuery({
    queryKey: adminPostKeys.communities,
    queryFn: fetchCommunityOptions,
    staleTime: 5 * 60 * 1000,
  });
}

/** Invalidate everything a moderation change can affect: table, stats, detail, reports. */
function useInvalidatePostData() {
  const queryClient = useQueryClient();
  return (postIds: string[] = []) => {
    queryClient.invalidateQueries({ queryKey: adminPostKeys.all });
    queryClient.invalidateQueries({ queryKey: adminPostKeys.stats });
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    for (const id of postIds) {
      queryClient.invalidateQueries({ queryKey: adminPostKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminPostKeys.reports(id) });
    }
  };
}

export function useModeratePost() {
  const invalidate = useInvalidatePostData();
  return useMutation({
    mutationFn: ({ postId, action, reason }: { postId: string; action: ModerationAction; reason?: string }) =>
      moderateAdminPost(postId, action, reason),
    onSuccess: (_data, variables) => invalidate([variables.postId]),
  });
}

export function useBulkModeratePosts() {
  const invalidate = useInvalidatePostData();
  return useMutation({
    mutationFn: ({ ids, action, reason }: { ids: string[]; action: ModerationAction; reason?: string }) =>
      bulkModerateAdminPosts(ids, action, reason),
    onSuccess: (_data, variables) => invalidate(variables.ids),
  });
}

export function useResolvePostReport() {
  const invalidate = useInvalidatePostData();
  return useMutation({
    mutationFn: ({ postId, reportId, action }: { postId: string; reportId: string; action: ReportResolution }) =>
      resolveAdminPostReport(postId, reportId, action),
    onSuccess: (_data, variables) => invalidate([variables.postId]),
  });
}
