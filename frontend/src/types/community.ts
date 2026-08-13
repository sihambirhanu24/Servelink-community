export interface Teacher {
  id: string;

  firstName: string;

  lastName: string;

  email: string;

  profileImage?: string;

  level: string;

  xp?: number;

  verified?: boolean;
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
  memberCount?: number;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  teacher: Teacher;
}

export interface Post {
  id: string;

  title: string;

  description: string;

  createdAt: string;

  teacher: Teacher;

  community: Community;

  category: Category;

  attachments: Attachment[];

  comments: Comment[];

  likesCount: number;

  liked: boolean;

  bookmarks: number;
}