export interface DiscussionAuthor {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  profileImage?: string | null;
  verified: boolean;
  subject?: string | null;
}

export interface Discussion {
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
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionDetail extends Discussion {
  isOwner: boolean;
}

export interface PaginatedDiscussions {
  data: Discussion[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateDiscussionDto {
  title: string;
  description: string;
  categoryId?: string;
  tags?: string[];
}

export interface UpdateDiscussionDto {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
}

export interface DiscussionMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderLevel: string;
  senderImage?: string | null;
  senderVerified?: boolean;
  senderSubject?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  reactions: MessageReaction[];
  editedAt?: string | null;
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  reaction: string;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DiscussionQueryParams {
  search?: string;
  categoryId?: string;
  tag?: string;
  sortBy?: 'latest' | 'mostActive' | 'mostDiscussed' | 'recentlyUpdated';
  page?: number;
  limit?: number;
}

export type ReportReason = 'SPAM' | 'ABUSE' | 'HARASSMENT' | 'MISINFORMATION' | 'OTHER';

export interface ReportDiscussionDto {
  reason: ReportReason;
  description?: string;
}
