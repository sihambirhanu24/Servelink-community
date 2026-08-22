import api from "@/lib/axios";

export interface TeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  department?: string | null;
  school: string;
  woreda: string;
  zone: string;
  region: string;
  level: string;
  verificationStatus: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByCurrentUser: boolean;
  isVerified: boolean;
}

export interface TeacherPost {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string | null;
    level: string;
    verified: boolean;
  };
  community: {
    id: string;
    name: string;
    type: string;
  };
  category: {
    id: string;
    name: string;
  };
  attachments: Array<{
    id: string;
    url: string;
    type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
    fileName?: string;
    fileSize?: number;
  }>;
  tags: Array<{
    id: string;
    name: string;
  }>;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
}

export interface TeacherPostsResponse {
  posts: TeacherPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FollowResponse {
  followerCount: number;
  isFollowedByCurrentUser: boolean;
}

export const getTeacherProfile = async (teacherId: string): Promise<TeacherProfile> => {
  const { data } = await api.get(`/teachers/${teacherId}/profile`);
  return data;
};

export const getTeacherPosts = async (
  teacherId: string,
  page: number = 1,
  limit: number = 10,
): Promise<TeacherPostsResponse> => {
  const { data } = await api.get(`/teachers/${teacherId}/posts`, {
    params: { page, limit },
  });
  return data;
};

export const followTeacher = async (teacherId: string): Promise<FollowResponse> => {
  const { data } = await api.post(`/teachers/${teacherId}/follow`);
  return data;
};

export const unfollowTeacher = async (teacherId: string): Promise<FollowResponse> => {
  const { data } = await api.delete(`/teachers/${teacherId}/follow`);
  return data;
};
