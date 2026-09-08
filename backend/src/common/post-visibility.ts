import { PostModerationStatus, Prisma } from '@prisma/client';

/**
 * Moderation states in which a post must not be served to regular teachers.
 * Admin endpoints intentionally do not use this filter.
 */
export const NON_PUBLIC_POST_STATUSES: PostModerationStatus[] = [
  PostModerationStatus.HIDDEN,
  PostModerationStatus.REMOVED,
];

/** Spread into any teacher-facing `communityPost` `where` clause. */
export const publiclyVisiblePostWhere: Prisma.CommunityPostWhereInput = {
  moderationStatus: { notIn: NON_PUBLIC_POST_STATUSES },
};

export function isPostPubliclyVisible(status: PostModerationStatus): boolean {
  return !NON_PUBLIC_POST_STATUSES.includes(status);
}
