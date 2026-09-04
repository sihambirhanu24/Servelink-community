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

export type TeacherStatus = 'ACTIVE' | 'SUSPENDED' | 'PERMANENTLY_SUSPENDED';
export type SuspensionType = 'WARNING' | 'TEMPORARY' | 'PERMANENT';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  status: TeacherStatus;
  school: string;
  region?: string | null;
  verified: boolean;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  /** Present when the account is suspended (mirrors Teacher columns on the backend). */
  suspensionReason?: string | null;
  suspensionStart?: string | null;
  suspensionUntil?: string | null;
  suspendedBy?: string | null;
  suspensionCount?: number;
}

/** One row of `SuspensionHistory`, enriched by the backend with actor names and a derived status. */
export interface SuspensionHistoryItem {
  id: string;
  teacherId: string;
  suspensionType: SuspensionType;
  reason: string;
  suspendedBy: string;
  suspendedByName: string | null;
  suspendedAt: string;
  suspendedUntil: string | null;
  restoredAt: string | null;
  restoredBy: string | null;
  restoredByName: string | null;
  reportId: string | null;
  /** `restoredAt` if lifted, otherwise the scheduled end (null = permanent / still open). */
  endedAt: string | null;
  status: 'WARNING' | 'ACTIVE' | 'COMPLETED';
}
