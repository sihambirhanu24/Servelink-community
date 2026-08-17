import { TeacherLevelType } from '@prisma/client';

export class ProgressResponseDto {
  points: number;
  level: TeacherLevelType;
  nextLevel: TeacherLevelType | null;
  pointsToNextLevel: number;
  progressPercentage: number;
  privilegeActive: boolean;
  privilegeExpiresAt: Date | null;
}
