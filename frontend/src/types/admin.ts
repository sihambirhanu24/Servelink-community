export interface AdminDashboardStats {
  teachers: number;
  communities: number;
  posts: number;
  reports: number;
  pendingVerification: number;
}

export interface TeacherLevelStat {
  level: string;
  _count: number;
}

export interface RecentTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  createdAt: string;
}

export interface RecentActivityItem {
  id: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  reason?: string;
  createdAt: string;
  community?: { name: string };
  teacher?: { firstName: string; lastName: string };
  post?: { title: string };
}

export interface AdminDashboardData {
  statistics: AdminDashboardStats;
  teacherLevels: TeacherLevelStat[];
  recentTeachers: RecentTeacher[];
  recentActivity?: {
    registrations: RecentActivityItem[];
    posts: RecentActivityItem[];
    reports: RecentActivityItem[];
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export interface TeachersResponse {
  data: Teacher[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  status: 'ACTIVE' | 'SUSPENDED';
  school: string;
  verified: boolean;
  createdAt: string;
}
