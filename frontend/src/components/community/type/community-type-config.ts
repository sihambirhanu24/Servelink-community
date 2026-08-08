export interface CommunityTypeConfig {
  type: 'SCHOOL' | 'WOREDA' | 'ZONE' | 'REGION' | 'NATIONAL';
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  memberLabel: string; // "Members" for School, "Teachers" for Woreda — same underlying count, different word per spec
  categories: string[];
}

// NOTE: "Resources Shared" / "Active Discussions" / "Schools
// Participating" from the original spec are NOT here — your backend's
// _count only computes `posts` and `communityMembers`. Those three
// numbers would need new aggregation queries (e.g. counting posts
// with attachments for "resources," or distinct comment threads for
// "discussions") that don't exist yet. Only real, computed numbers
// are represented in this config.
export const COMMUNITY_TYPE_CONFIGS: Record<string, CommunityTypeConfig> = {
  SCHOOL: {
    type: 'SCHOOL',
    eyebrow: 'School Community',
    heroTitle: 'School Community',
    heroSubtitle: 'Daily collaboration with teachers at your school.',
    memberLabel: 'Members',
    categories: [
      'Lesson Plans', 'Homework', 'Student Support', 'Teaching Resources',
      'Announcements', 'Discussions', 'School Events',
    ],
  },
  WOREDA: {
    type: 'WOREDA',
    eyebrow: 'Woreda Community',
    heroTitle: 'Woreda Community',
    heroSubtitle:
      'Connect teachers across multiple schools, share best practices, and collaborate on educational initiatives.',
    memberLabel: 'Teachers',
    categories: [
      'Curriculum', 'Teacher Training', 'Teaching Resources', 'Official Announcements',
      'Best Practices', 'School Collaboration', 'Education Policy', 'Questions',
    ],
  },
};
