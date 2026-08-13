export interface DashboardTeacher {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  profileImage?: string | null;
  school: string;
  woreda: string;
  zone: string;
  region: string;
  subject?: string | null;
  verified: boolean;
}

export interface DashboardStats {
  posts: number;
  bookmarks: number;
  communities: number;
  likes: number;
}

export interface DashboardRecentPost {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  community: { id: string; name: string; type: string; createdAt?: string } | null;
  category: { id: string; name: string; createdAt?: string } | null;
  _count: {
    communityLikes: number;
    comments: number;
    communityBookmarks: number;
  };
}

export interface DashboardFeedPost {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  community: { id: string; name: string; type: string; createdAt?: string } | null;
  category: { id: string; name: string; createdAt?: string } | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string | null;
    level: string;
    verified: boolean;
  } | null;
  _count: { communityLikes: number; comments: number };
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
  senderName?: string | null;
}

export interface DashboardSuggestedCommunity {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  _count: { communityMembers: number; posts: number };
}

export interface DashboardCommunityAccessTier {
  type: string;
  unlocked: boolean;
  required: number;
  joined: number;
  available: number;
}

export interface DashboardData {
  teacher: DashboardTeacher;
  stats: DashboardStats;
  recentPosts: DashboardRecentPost[];
  communityFeed: DashboardFeedPost[];
  recentNotifications: DashboardNotification[];
  suggestedCommunities: DashboardSuggestedCommunity[];
  communityAccess: DashboardCommunityAccessTier[];
}
