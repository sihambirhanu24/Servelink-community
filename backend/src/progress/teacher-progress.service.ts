import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TeacherVerificationService } from '../verification/teacher-verification.service';
import { NotificationEvent } from '../notification/notification.types';
import { TeacherLevelType, TeacherActivityType } from '@prisma/client';
import {
  LEVEL_THRESHOLDS,
  POINT_VALUES,
  ANTI_SPAM_CONFIG,
  PRIVILEGE_DURATION_MS,
  ProgressResponse,
} from './types/progress.types';

@Injectable()
export class TeacherProgressService {
  private readonly logger = new Logger(TeacherProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly verificationService: TeacherVerificationService,
  ) { }

  /**
   * Calculate the appropriate level based on points
   * This is the SINGLE SOURCE OF TRUTH for level calculation
   */
  calculateLevel(points: number): TeacherLevelType {
    if (points >= LEVEL_THRESHOLDS.LEVEL_5.min) return TeacherLevelType.LEVEL_5;
    if (points >= LEVEL_THRESHOLDS.LEVEL_4.min) return TeacherLevelType.LEVEL_4;
    if (points >= LEVEL_THRESHOLDS.LEVEL_3.min) return TeacherLevelType.LEVEL_3;
    if (points >= LEVEL_THRESHOLDS.LEVEL_2.min) return TeacherLevelType.LEVEL_2;
    return TeacherLevelType.LEVEL_1;
  }

  /**
   * Get the next level based on current level
   */
  private getNextLevel(currentLevel: TeacherLevelType): TeacherLevelType | null {
    const levels = [
      TeacherLevelType.LEVEL_1,
      TeacherLevelType.LEVEL_2,
      TeacherLevelType.LEVEL_3,
      TeacherLevelType.LEVEL_4,
      TeacherLevelType.LEVEL_5,
    ];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  /**
   * Calculate points required to reach the next level
   */
  private calculatePointsToNextLevel(currentPoints: number, currentLevel: TeacherLevelType): number {
    const nextLevel = this.getNextLevel(currentLevel);
    if (!nextLevel) return 0;

    const nextThreshold = LEVEL_THRESHOLDS[nextLevel].min;
    return Math.max(0, nextThreshold - currentPoints);
  }

  /**
   * Calculate progress percentage towards next level
   */
  private calculateProgressPercentage(
    currentPoints: number,
    currentLevel: TeacherLevelType,
  ): number {
    const nextLevel = this.getNextLevel(currentLevel);
    if (!nextLevel) return 100;

    const currentThreshold = LEVEL_THRESHOLDS[currentLevel].min;
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel].min;
    const range = nextThreshold - currentThreshold;
    const progress = currentPoints - currentThreshold;

    return Math.min(100, Math.round((progress / range) * 100));
  }

  // 24-hour privilege logic removed as per user request (level-ups are now permanent without trial text)

  /**
   * Update teacher level and activate privilege if upgraded
   */
  private async updateTeacherLevel(
    teacherId: string,
    oldLevel: TeacherLevelType,
    newLevel: TeacherLevelType,
    teacherName: string,
  ): Promise<void> {
    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { level: newLevel },
    });

    // If level increased, activate privilege and send notification
    const levels = [
      TeacherLevelType.LEVEL_1,
      TeacherLevelType.LEVEL_2,
      TeacherLevelType.LEVEL_3,
      TeacherLevelType.LEVEL_4,
      TeacherLevelType.LEVEL_5,
    ];
    const oldIndex = levels.indexOf(oldLevel);
    const newIndex = levels.indexOf(newLevel);

    if (newIndex > oldIndex) {
      // Level upgraded

      // Send notification
      this.notificationService
        .create({
          receiverId: teacherId,
          title: 'Level Upgrade! 🎉',
          message: `Congratulations ${teacherName}! You've been permanently upgraded to ${newLevel.replace('_', ' ')}. You now have full access to new communities!`,
          type: NotificationEvent.LEVEL_UPGRADE,
        })
        .catch((err) => this.logger.error(`Failed to send upgrade notification: ${err.message}`));

      this.logger.log(`Teacher ${teacherId} upgraded from ${oldLevel} to ${newLevel}`);
    } else if (newIndex < oldIndex) {
      // Level downgraded (due to violation)
      this.logger.log(`Teacher ${teacherId} downgraded from ${oldLevel} to ${newLevel}`);
    }
  }

  /**
   * Record a teacher activity and award/deduct points
   * This is the CORE method for all point changes
   */
  private async recordActivity(
    teacherId: string,
    type: TeacherActivityType,
    referenceId: string | null,
    pointValue: number,
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      // Use upsert to handle duplicate protection at database level
      await this.prisma.teacherActivity.create({
        data: {
          teacherId,
          type,
          points: pointValue,
          referenceId,
        },
      });

      return { success: true };
    } catch (error) {
      // Unique constraint violation means this activity was already rewarded
      if (error.code === 'P2002') {
        this.logger.debug(
          `Duplicate activity prevented: ${type} for teacher ${teacherId}, reference ${referenceId}`,
        );
        return { success: false, reason: 'duplicate' };
      }
      throw error;
    }
  }

  /**
   * Check if teacher has reached daily post reward limit
   */
  private async hasReachedDailyPostLimit(teacherId: string): Promise<boolean> {
    // Get start of today in backend timezone (UTC)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const count = await this.prisma.teacherActivity.count({
      where: {
        teacherId,
        type: TeacherActivityType.POST_CREATED,
        points: { gt: 0 }, // Only count rewards, not penalties
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    return count >= ANTI_SPAM_CONFIG.MAX_REWARDED_POSTS_PER_DAY;
  }

  /**
   * Award points for creating a post
   * Enforces daily reward limit (max 3 posts per day)
   * REQUIRES: Teacher must have APPROVED verification status to earn points
   */
  async awardPostPoints(
    teacherId: string,
    postId: string,
  ): Promise<{ awarded: boolean; reason: string }> {
    // SECURITY CHECK: Only APPROVED teachers can earn progression points
    const isVerified = await this.verificationService.isTeacherVerified(teacherId);
    if (!isVerified) {
      this.logger.debug(
        `Teacher ${teacherId} is not verified - post created but no points awarded`,
      );
      return {
        awarded: false,
        reason: 'Teacher verification required to earn points',
      };
    }

    // Check daily limit
    const limitReached = await this.hasReachedDailyPostLimit(teacherId);
    if (limitReached) {
      this.logger.debug(`Teacher ${teacherId} has reached daily post reward limit`);
      return {
        awarded: false,
        reason: 'Daily reward limit reached (3 posts per day)',
      };
    }

    // Record activity
    const result = await this.recordActivity(
      teacherId,
      TeacherActivityType.POST_CREATED,
      postId,
      POINT_VALUES.POST_CREATED,
    );

    if (!result.success) {
      return {
        awarded: false,
        reason: 'Post already rewarded',
      };
    }

    // Update teacher points and level
    await this.recalculateTeacherProgress(teacherId);

    this.logger.log(`Awarded ${POINT_VALUES.POST_CREATED} points to teacher ${teacherId} for post ${postId}`);
    return {
      awarded: true,
      reason: 'Post creation rewarded',
    };
  }

  /**
   * Award points to post owner for receiving a like
   */
  async awardLikePoints(postOwnerId: string, postId: string, likerId: string): Promise<void> {
    // Create a unique reference combining post and liker
    const referenceId = `${postId}:${likerId}`;

    const result = await this.recordActivity(
      postOwnerId,
      TeacherActivityType.LIKE_RECEIVED,
      referenceId,
      POINT_VALUES.LIKE_RECEIVED,
    );

    if (result.success) {
      await this.recalculateTeacherProgress(postOwnerId);
      this.logger.log(`Awarded ${POINT_VALUES.LIKE_RECEIVED} point to teacher ${postOwnerId} for like on post ${postId}`);
    }
  }

  /**
   * Remove points when a like is removed (unlike)
   */
  async removeLikePoints(postOwnerId: string, postId: string, likerId: string): Promise<void> {
    const referenceId = `${postId}:${likerId}`;

    try {
      // Find and delete the specific activity
      await this.prisma.teacherActivity.delete({
        where: {
          teacherId_type_referenceId: {
            teacherId: postOwnerId,
            type: TeacherActivityType.LIKE_RECEIVED,
            referenceId,
          },
        },
      });

      await this.recalculateTeacherProgress(postOwnerId);
      this.logger.log(`Removed ${POINT_VALUES.LIKE_RECEIVED} point from teacher ${postOwnerId} for unlike on post ${postId}`);
    } catch (error) {
      // Activity not found - already removed or never existed
      this.logger.debug(`Like activity not found for removal: ${referenceId}`);
    }
  }

  /**
   * Award points to post owner for receiving a bookmark
   */
  async awardBookmarkPoints(postOwnerId: string, postId: string, bookmarkerId: string): Promise<void> {
    const referenceId = `${postId}:${bookmarkerId}`;

    const result = await this.recordActivity(
      postOwnerId,
      TeacherActivityType.BOOKMARK_RECEIVED,
      referenceId,
      POINT_VALUES.BOOKMARK_RECEIVED,
    );

    if (result.success) {
      await this.recalculateTeacherProgress(postOwnerId);
      this.logger.log(`Awarded ${POINT_VALUES.BOOKMARK_RECEIVED} point to teacher ${postOwnerId} for bookmark on post ${postId}`);
    }
  }

  /**
   * Remove points when a bookmark is removed
   */
  async removeBookmarkPoints(postOwnerId: string, postId: string, bookmarkerId: string): Promise<void> {
    const referenceId = `${postId}:${bookmarkerId}`;

    try {
      await this.prisma.teacherActivity.delete({
        where: {
          teacherId_type_referenceId: {
            teacherId: postOwnerId,
            type: TeacherActivityType.BOOKMARK_RECEIVED,
            referenceId,
          },
        },
      });

      await this.recalculateTeacherProgress(postOwnerId);
      this.logger.log(`Removed ${POINT_VALUES.BOOKMARK_RECEIVED} point from teacher ${postOwnerId} for unbookmark on post ${postId}`);
    } catch (error) {
      this.logger.debug(`Bookmark activity not found for removal: ${referenceId}`);
    }
  }

  /**
   * Apply penalty when a violation is confirmed by admin
   */
  async applyViolationPenalty(
    teacherId: string,
    postId: string,
    reportId: string,
  ): Promise<void> {
    // Use reportId as reference to ensure each violation is only penalized once
    const referenceId = reportId;

    const result = await this.recordActivity(
      teacherId,
      TeacherActivityType.VIOLATION_CONFIRMED,
      referenceId,
      POINT_VALUES.VIOLATION_CONFIRMED,
    );

    if (result.success) {
      await this.recalculateTeacherProgress(teacherId);
      this.logger.warn(`Applied ${POINT_VALUES.VIOLATION_CONFIRMED} point penalty to teacher ${teacherId} for violation on post ${postId}`);
    }
  }

  /**
   * Recalculate teacher progress based on all activities
   * This ensures the teacher's level is always accurate
   */
  private async recalculateTeacherProgress(teacherId: string): Promise<void> {
    // Get current teacher state
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        level: true,
      },
    });

    if (!teacher) {
      this.logger.error(`Teacher ${teacherId} not found during recalculation`);
      return;
    }

    // Calculate total points from all activities
    const activities = await this.prisma.teacherActivity.findMany({
      where: { teacherId },
      select: { points: true },
    });

    const totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
    // Ensure points never go below zero
    const finalPoints = Math.max(0, totalPoints);

    // Calculate correct level
    const newLevel = this.calculateLevel(finalPoints);
    const oldLevel = teacher.level;

    // Update points
    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { points: finalPoints },
    });

    // Update level if changed
    if (newLevel !== oldLevel) {
      const teacherName = `${teacher.firstName} ${teacher.lastName}`;
      await this.updateTeacherLevel(teacherId, oldLevel, newLevel, teacherName);
    }
  }

  /**
   * Get teacher's current progression status
   */
  async getProgress(teacherId: string): Promise<ProgressResponse> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        points: true,
        level: true,
        privilegeStartAt: true,
        privilegeExpiresAt: true,
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const nextLevel = this.getNextLevel(teacher.level);
    const pointsToNextLevel = this.calculatePointsToNextLevel(teacher.points, teacher.level);
    const progressPercentage = this.calculateProgressPercentage(teacher.points, teacher.level);

    return {
      points: teacher.points,
      level: teacher.level,
      nextLevel,
      pointsToNextLevel,
      progressPercentage,
      privilegeActive: false,
      privilegeExpiresAt: null,
    };
  }

  /**
   * Get teacher's activity history
   */
  async getActivityHistory(teacherId: string, limit = 50) {
    return this.prisma.teacherActivity.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
