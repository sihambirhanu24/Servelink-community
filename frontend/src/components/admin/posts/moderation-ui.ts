import type {
  ModerationAction,
  ModerationStatus,
  PostSort,
  PostType,
  ReportFilter,
  ReportReason,
  ReportStatus,
} from '@/services/admin-posts';

export const STATUS_LABELS: Record<ModerationStatus, string> = {
  ACTIVE: 'Published',
  REPORTED: 'Reported',
  UNDER_REVIEW: 'Under Review',
  HIDDEN: 'Hidden',
  REMOVED: 'Deleted',
};

export const STATUS_BADGE: Record<ModerationStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  REPORTED: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  HIDDEN: 'bg-purple-100 text-purple-700',
  REMOVED: 'bg-slate-200 text-slate-700',
};

export const TYPE_LABELS: Record<PostType, string> = {
  QUESTION: 'Question',
  DISCUSSION: 'Discussion',
  RESOURCE: 'Resource',
  ANNOUNCEMENT: 'Announcement',
};

export const TYPE_BADGE: Record<PostType, string> = {
  QUESTION: 'bg-blue-100 text-blue-700',
  DISCUSSION: 'bg-purple-100 text-purple-700',
  RESOURCE: 'bg-amber-100 text-amber-800',
  ANNOUNCEMENT: 'bg-rose-100 text-rose-700',
};

export const REPORT_FILTER_LABELS: Record<ReportFilter, string> = {
  UNRESOLVED: 'Has unresolved reports',
  REPORTED: 'Has any report',
  RESOLVED: 'All reports reviewed',
  NO_REPORTS: 'No reports',
};

export const SORT_LABELS: Record<PostSort, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  most_reported: 'Most reported',
  most_engaged: 'Most engaged',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  ABUSE: 'Abuse',
  HARASSMENT: 'Harassment',
  MISINFORMATION: 'Misinformation',
  FAKE_INFORMATION: 'Fake information',
  OTHER: 'Other',
};

export const REPORT_STATUS_BADGE: Record<ReportStatus, string> = {
  PENDING: 'bg-red-100 text-red-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-slate-200 text-slate-700',
};

export const ACTION_LABELS: Record<ModerationAction, string> = {
  HIDDEN: 'Hide',
  REMOVE: 'Delete',
  RESTORE: 'Restore',
};

/** Which actions make sense for a post in a given state (mirrors backend ALLOWED_FROM). */
export function allowedActions(status: ModerationStatus): ModerationAction[] {
  switch (status) {
    case 'ACTIVE':
    case 'REPORTED':
    case 'UNDER_REVIEW':
      return ['HIDDEN', 'REMOVE'];
    case 'HIDDEN':
      return ['RESTORE', 'REMOVE'];
    case 'REMOVED':
      return ['RESTORE'];
  }
}

export function teacherLevelLabel(level?: string | null) {
  if (!level) return null;
  const match = /^LEVEL_(\d)$/.exec(level);
  return match ? `Level ${match[1]}` : level;
}

export function formatAdminDate(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAdminDateTime(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fullName(person: { firstName?: string | null; lastName?: string | null }) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown';
}

export function initials(person: { firstName?: string | null; lastName?: string | null }) {
  return `${person.firstName?.[0] ?? ''}${person.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function apiErrorMessage(error: unknown, fallback: string) {
  const maybe = error as { response?: { data?: { message?: string | string[] } } } | undefined;
  const message = maybe?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
}
