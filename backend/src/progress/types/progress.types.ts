import { TeacherLevelType } from '@prisma/client';

/**
 * Response structure for teacher progression information
 */
export interface ProgressResponse {
  points: number;
  level: TeacherLevelType;
  nextLevel: TeacherLevelType | null;
  pointsToNextLevel: number;
  progressPercentage: number;
  privilegeActive: boolean;
  privilegeExpiresAt: Date | null;
}

/**
 * Level thresholds for progression
 */
export const LEVEL_THRESHOLDS = {
  LEVEL_1: { min: 0, max: 19 },
  LEVEL_2: { min: 20, max: 49 },
  LEVEL_3: { min: 50, max: 99 },
  LEVEL_4: { min: 100, max: 199 },
  LEVEL_5: { min: 200, max: Infinity },
} as const;

/**
 * Point values for different activities
 */
export const POINT_VALUES = {
  POST_CREATED: 5,
  LIKE_RECEIVED: 1,
  BOOKMARK_RECEIVED: 1,
  VIOLATION_CONFIRMED: -5,
} as const;

/**
 * Anti-spam configuration
 */
export const ANTI_SPAM_CONFIG = {
  MAX_REWARDED_POSTS_PER_DAY: 3,
} as const;

/**
 * Privilege duration in milliseconds (24 hours)
 */
export const PRIVILEGE_DURATION_MS = 24 * 60 * 60 * 1000;
