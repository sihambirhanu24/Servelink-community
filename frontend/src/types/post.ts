export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  level: string;
}

export interface Community {
  id: string;
  name: string;
  type?: string;
  school?: string | null;
  woreda?: string | null;
  zone?: string | null;
  region?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
}

export interface CommunityLike {
  id: string;
  teacherId: string;
  postId: string;
}

export interface Comment {
  id: string;
  content: string;
}

export interface Post {
  id: string;

  title: string;
  description: string;

  createdAt: string;

  teacher: Teacher;

  community: Community;

  category: Category;

  communityLikes: CommunityLike[];

  comments: Comment[];

  // Total number of likes
  likesCount: number;

  // Whether the logged-in user liked it
  liked: boolean;
}