import api from "@/lib/axios";

export const getPosts = async (options?: {
  search?: string;
  communityId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get("/community/posts", {
    params: {
      search: options?.search ?? undefined,
      communityId: options?.communityId ?? undefined,
      categoryId: options?.categoryId ?? undefined,
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    },
  });
  return data;
};

export const getCommunities = async () => {
  const { data } = await api.get("/community");
  return data.communities;
};

export const getCategories = async () => {
  const { data } = await api.get("/community/categories");
  return data;
};

export const createPost = async (body: {
  title: string;
  description: string;
  communityId: string;
  categoryId: string;
}) => {
  const { data } = await api.post("/community/posts", body);
  return data;
};
export const joinCommunity = async (communityId: string) => {
  const { data } = await api.post("/membership/join", {
    communityId,
  });

  return data;
};

export const leaveCommunity = async (communityId: string) => {
  const { data } = await api.delete(
    `/membership/${communityId}/leave`
  );

  return data;
};

export const getMembers = async (communityId: string) => {
  const { data } = await api.get(
    `/membership/${communityId}/members`
  );

  return data;
};
export const getPostById = async (id: string) => {
  const { data } = await api.get(`/community/posts/${id}`);
  return data;
};

export const updatePost = async (
  id: string,
  body: any
) => {
  const { data } = await api.patch(
    `/community/posts/${id}`,
    body
  );

  return data;
};

export const deletePost = async (id: string) => {
  const { data } = await api.delete(
    `/community/posts/${id}`
  );

  return data;
};
export const likePost = async (id: string) => {
  const { data } = await api.post(`/community/posts/${id}/like`);
  return data;
};

export const unlikePost = async (id: string) => {
  const { data } = await api.delete(`/community/posts/${id}/like`);
  return data;
};
export const getCommunity = async (
  id: string,
) => {
  const { data } = await api.get(
    `/community/${id}`,
  );

  return data;
};
export const uploadAttachment = async (
  postId: string,
  file: File,
) => {
  const formData = new FormData();

  formData.append("file", file);

  const { data } = await api.post(
    `/community/posts/${postId}/attachment`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};
export const removeBookmark = async (id: string) => {
  const { data } = await api.delete(
    `/community/posts/${id}/bookmark`
  );

  return data;
};
export const bookmarkPost = async (id: string) => {
  const { data } = await api.post(`/community/posts/${id}/bookmark`);
  return data;
};

export const getBookmarks = async () => {
  const { data } = await api.get("/profile/bookmarks");
  // Backend returns CommunityBookmark[] where each has { post: {...} }
  // Normalise to an array of flat post objects with a savedAt field
  const raw: any[] = Array.isArray(data) ? data : data.bookmarks ?? data.posts ?? [];
  return raw.map((item: any) => {
    const post = item.post ?? item;
    return {
      ...post,
      savedAt: item.createdAt,
      likesCount: post.communityLikes?.length ?? post.likesCount ?? 0,
      commentsCount: post.comments?.length ?? post.commentsCount ?? 0,
    };
  });
};

// ─── Community-type scoped fetchers ──────────────────────────────────────────

export interface CommunityTypeMember {
  id: string;
  teacherId: string;
  communityId: string;
  status: string;
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string | null;
    level: string;
    school: string;
    subject?: string | null;
  };
}

export interface CommunityTypeData {
  id: string;
  name: string;
  type: string;
  school?: string | null;
  woreda?: string | null;
  zone?: string | null;
  region?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  communityMembers: CommunityTypeMember[];
  _count: { communityMembers: number; posts: number };
}

export interface CommunityTypeResponse {
  teacherLevel: string;
  community: CommunityTypeData;
}

export const getCommunitiesByType = async (type: string): Promise<CommunityTypeResponse> => {
  const { data } = await api.get(`/community/type/${type}`);
  return data as CommunityTypeResponse;
};

export interface CommunityTypePost {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  liked: boolean;
  bookmarked: boolean;
  likesCount: number;
  bookmarks: number;
  community?: { name: string } | null;
  category?: { name: string } | null;
  teacher?: {
    id?: string;
    firstName: string;
    lastName: string;
    level: string;
    verified?: boolean;
    profileImage?: string | null;
    school?: string;
    subject?: string | null;
  } | null;
  communityLikes?: Array<{ teacherId: string }>;
  comments?: Array<unknown>;
  attachments?: Array<{
    id: string;
    url: string;
    type: 'IMAGE' | 'PDF' | 'DOCX' | 'VIDEO';
    fileName?: string;
    fileSize?: number;
  }>;
}

export const getPostsByType = async (
  type: string,
  params?: {
    search?: string;
    categoryId?: string;
    filter?: string;
    page?: number;
    limit?: number;
  },
): Promise<CommunityTypePost[]> => {
  const { data } = await api.get(`/community/type/${type}/posts`, { params });
  return data as CommunityTypePost[];
};

export interface CommunityTypeMemberRow {
  id: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    level: string;
    school: string;
    subject?: string | null;
    profileImage?: string | null;
    verified?: boolean;
  };
}

export const getMembersByType = async (type: string): Promise<CommunityTypeMemberRow[]> => {
  const { data } = await api.get(`/community/type/${type}/members`);
  return data as CommunityTypeMemberRow[];
};