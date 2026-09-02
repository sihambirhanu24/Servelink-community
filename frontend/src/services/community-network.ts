import api from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NetworkTeacher {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  level: string;
  verified?: boolean;
}

export interface TopContributor {
  rank: number;
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  level: string;
  points: number;
}

export interface NetworkPost {
  id: string;
  title: string;
  description: string;
  postType: string;
  isResolved: boolean;
  views: number;
  createdAt: string;
  teacher: NetworkTeacher;
  community?: { id: string; name: string; type: string } | null;
  _count: { comments: number; communityLikes: number };
  attachments?: { id: string; url: string; type: string; fileName: string; fileSize: number }[];
}

export interface NetworkOverview {
  stats: {
    members: number;
    questions: number;
    discussions: number;
    resources: number;
  };
  recentQuestions: NetworkPost[];
  recentDiscussions: NetworkPost[];
  recentResources: NetworkPost[];
}

export interface CommunityGuideline {
  id: string;
  title: string;
  description: string;
  icon?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface PostComment {
  id: string;
  content: string;
  postId: string;
  parentId?: string | null;
  isAccepted: boolean;
  helpfulCount: number;
  markedHelpful: boolean;
  createdAt: string;
  updatedAt: string;
  teacher: NetworkTeacher;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getNetworkOverview(): Promise<NetworkOverview> {
  const { data } = await api.get<NetworkOverview>("/community/network/overview");
  return data;
}

export async function getTopContributors(limit: number = 10): Promise<TopContributor[]> {
  const { data } = await api.get<TopContributor[]>("/community/network/top-contributors", {
    params: { limit },
  });
  return data;
}

export async function getGuidelines(): Promise<CommunityGuideline[]> {
  const { data } = await api.get<CommunityGuideline[]>("/community/guidelines");
  return data;
}

export async function seedGuidelines() {
  const { data } = await api.post("/community/guidelines/seed");
  return data;
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const { data } = await api.get<PostComment[]>(`/community/posts/${postId}/comments`);
  return data;
}

export async function createComment(postId: string, content: string) {
  const { data } = await api.post(`/community/posts/${postId}/comments`, { content });
  return data;
}

export async function markBestAnswer(commentId: string) {
  const { data } = await api.post(`/community/network/questions/answers/${commentId}/best-answer`);
  return data;
}

export async function markHelpful(commentId: string) {
  const { data } = await api.post(`/community/network/answers/${commentId}/helpful`);
  return data;
}
