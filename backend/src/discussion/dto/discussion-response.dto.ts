export interface DiscussionAuthor {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  profileImage?: string | null;
  verified: boolean;
  subject?: string | null;
}

export interface DiscussionResponse {
  id: string;
  title: string;
  description: string;
  author: DiscussionAuthor;
  category?: {
    id: string;
    name: string;
  } | null;
  tags: string[];
  views: number;
  replyCount: number;
  isBookmarked?: boolean;
  isPinned: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionDetailResponse extends DiscussionResponse {
  isOwner: boolean;
}

export interface PaginatedDiscussionsResponse {
  data: DiscussionResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateDiscussionResult {
  discussion: DiscussionDetailResponse;
  pointsAwarded: number;
  progress: any; // We use any here to avoid cyclic dependency or importing ProgressResponse from another module if not already exported properly
}
