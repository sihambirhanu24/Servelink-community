import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification.types';
import { TeacherProgressService } from '../../progress/teacher-progress.service';
import { TeacherActivityType } from '@prisma/client';
import { POINT_VALUES } from '../../progress/types/progress.types';
import { CommunityService } from './community.service';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateQuestionDto {
  communityType: string;
  title: string;
  description: string;
  categoryId: string;
  /** deadline in hours from now, OR an ISO date string */
  deadline: number | string;
}

export interface SubmitAnswerDto {
  content: string;
}

export interface QuestionFilterDto {
  status?: 'OPEN' | 'CLOSED' | 'SOLVED' | 'all';
  sort?: 'newest' | 'most-answers' | 'most-helpful' | 'ending-soon';
  search?: string;
  page?: number;
  limit?: number;
  mine?: boolean;
  communityType?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class QaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly progressService: TeacherProgressService,
    private readonly communityService: CommunityService,
  ) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  /** Resolve the deadline DateTime from hours (number) or ISO string */
  private resolveDeadline(deadline: number | string): Date {
    if (typeof deadline === 'number') {
      return new Date(Date.now() + deadline * 60 * 60 * 1000);
    }
    const d = new Date(deadline);
    if (isNaN(d.getTime())) {
      throw new BadRequestException('Invalid deadline value');
    }
    return d;
  }

  /**
   * Server-authoritative: is this question currently open?
   * A question is OPEN when its stored status is OPEN AND the deadline
   * has not yet passed (or no deadline was set).
   */
  private isOpen(post: { questionStatus: string; deadline: Date | null }): boolean {
    if (post.questionStatus !== 'OPEN') return false;
    if (!post.deadline) return true; // no deadline = always open
    return new Date() < post.deadline;
  }

  /** Compute the effective status using server time */
  private effectiveStatus(post: { questionStatus: string; deadline: Date | null }): string {
    if (post.questionStatus === 'SOLVED') return 'SOLVED';
    if (post.questionStatus === 'CLOSED') return 'CLOSED';
    // OPEN — check deadline
    if (post.deadline && new Date() >= post.deadline) return 'CLOSED';
    return 'OPEN';
  }

  /** Award points for Q&A activities — fire and forget */
  private async awardQaPoints(
    teacherId: string,
    activityType: TeacherActivityType,
    referenceId: string,
    points: number,
  ) {
    try {
      await this.prisma.teacherActivity.create({
        data: { teacherId, type: activityType, referenceId, points },
      });
      await this.progressService.recalculateTeacherProgress(teacherId);
    } catch (e: any) {
      // P2002 = unique constraint (already rewarded) — silently ignore
      if (e?.code !== 'P2002') {
        console.error(`Failed to award QA points (${activityType}):`, e?.message);
      }
    }
  }

  // ─── Resolve network community (auto-create) ─────────────────────────────

  private async resolveNetworkCommunity() {
    const existing = await this.prisma.community.findFirst({
      where: { type: 'NETWORK' as any },
    });
    if (existing) return existing;
    return this.prisma.community.create({
      data: {
        name: 'Network Community',
        type: 'NETWORK' as any,
        subtype: 'COMMON' as any,
        description: 'The global professional community for all verified ServeLink teachers.',
        isActive: true,
      },
    });
  }

  // ─── Create question ─────────────────────────────────────────────────────

  async createQuestion(teacherId: string, dto: CreateQuestionDto) {
    console.log('[QaService] createQuestion called:', { teacherId, dto });
    const deadline = this.resolveDeadline(dto.deadline);
    const normalizedType = dto.communityType.toUpperCase();
    console.log('[QaService] Resolved deadline:', deadline, 'Type:', normalizedType);

    // Re-use CommunityService's type resolution for community
    // We call createPostByType logic but capture the community
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, school: true, woreda: true, zone: true, region: true, privilegeExpiresAt: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    console.log('[QaService] Teacher found:', teacher);

    // Find the community
    let community: any;
    if (normalizedType === 'NETWORK') {
      community = await this.resolveNetworkCommunity();
    } else {
      community = await this.prisma.community.findFirst({
        where: this.buildCommunityWhere(normalizedType, teacher),
        orderBy: { createdAt: 'asc' },
      });
      if (!community) throw new NotFoundException(`No ${normalizedType} community found.`);
    }
    console.log('[QaService] Community found:', community);

    const post = await this.prisma.communityPost.create({
      data: {
        postType: 'QUESTION',
        title: dto.title,
        description: dto.description,
        teacherId,
        communityId: community.id,
        categoryId: dto.categoryId,
        deadline,
        questionStatus: 'OPEN',
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true } },
        category: { select: { id: true, name: true } },
        community: { select: { id: true, name: true, type: true } },
        _count: { select: { comments: true } },
      },
    });

    this.progressService.awardQuestionPoints(teacherId, post.id).catch(() => {});
    return { ...post, effectiveStatus: 'OPEN', answerCount: 0 };
  }

  private buildCommunityWhere(type: string, teacher: any): any {
    const base = { type: type as any, isActive: true };
    if (type === 'SCHOOL' && teacher.school)
      return { ...base, OR: [{ school: { equals: teacher.school, mode: 'insensitive' } }, { name: { equals: teacher.school, mode: 'insensitive' } }] };
    if (type === 'WOREDA' && teacher.woreda)
      return { ...base, woreda: { equals: teacher.woreda, mode: 'insensitive' } };
    if (type === 'ZONE' && teacher.zone)
      return { ...base, zone: { equals: teacher.zone, mode: 'insensitive' } };
    if (type === 'REGION' && teacher.region)
      return { ...base, region: { equals: teacher.region, mode: 'insensitive' } };
    return base;
  }

  // ─── List questions ──────────────────────────────────────────────────────

  async getQuestions(teacherId: string, dto: QuestionFilterDto) {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: any = { postType: 'QUESTION' };

    if (dto.communityType) {
      const normalizedType = dto.communityType.toUpperCase();
      let communityId: string | null = null;
      if (normalizedType === 'NETWORK') {
        const community = await this.resolveNetworkCommunity();
        communityId = community.id;
      } else {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: teacherId },
          select: { school: true, woreda: true, zone: true, region: true },
        });
        if (teacher) {
          const community = await this.prisma.community.findFirst({
            where: this.buildCommunityWhere(normalizedType, teacher),
            orderBy: { createdAt: 'asc' },
          });
          if (community) {
            communityId = community.id;
          }
        }
      }
      if (communityId) {
        where.communityId = communityId;
      } else {
        // If community not found, return empty results early
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
    }

    if (dto.search) {
      where.OR = [
        { title:       { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.mine) {
      where.teacherId = teacherId;
    }

    const now = new Date();
    if (dto.status === 'OPEN') {
      where.questionStatus = 'OPEN';
      where.OR = [{ deadline: null }, { deadline: { gt: now } }];
    } else if (dto.status === 'CLOSED') {
      where.OR = [
        { questionStatus: 'CLOSED' },
        { questionStatus: 'OPEN', deadline: { lte: now } },
      ];
    } else if (dto.status === 'SOLVED') {
      where.questionStatus = 'SOLVED';
    }

    const orderBy: any =
      dto.sort === 'most-answers'  ? { comments: { _count: 'desc' } } :
      dto.sort === 'ending-soon'   ? { deadline: 'asc' } :
      { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true } },
          category: { select: { id: true, name: true } },
          community: { select: { id: true, name: true, type: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    const data = posts.map((p) => ({
      ...p,
      effectiveStatus: this.effectiveStatus(p),
      answerCount: p._count.comments,
      isOpen: this.isOpen(p),
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Question detail (with blind-answer enforcement) ─────────────────────

  async getQuestion(questionId: string, teacherId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: questionId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true, verified: true } },
        category: { select: { id: true, name: true } },
        community: { select: { id: true, name: true, type: true } },
        tags: { include: { tag: true } },
        attachments: true,
        _count: { select: { comments: true } },
      },
    });

    if (!post || post.postType !== 'QUESTION') {
      throw new NotFoundException('Question not found');
    }

    // Increment view count (fire and forget)
    this.prisma.communityPost.update({ where: { id: questionId }, data: { views: { increment: 1 } } }).catch(() => {});

    const status = this.effectiveStatus(post);
    const isAsker = post.teacherId === teacherId;

    // Auto-close if deadline passed but status still OPEN
    if (status === 'CLOSED' && post.questionStatus === 'OPEN') {
      this.prisma.communityPost.update({
        where: { id: questionId },
        data: { questionStatus: 'CLOSED' },
      }).catch(() => {});
    }

    return {
      ...post,
      effectiveStatus: status,
      isOpen: status === 'OPEN',
      isAsker,
      answerCount: post._count.comments,
    };
  }

  // ─── Get answers (enforces blind-answer security server-side) ────────────

  async getAnswers(questionId: string, teacherId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: questionId },
      select: { id: true, teacherId: true, questionStatus: true, deadline: true, postType: true },
    });

    if (!post || post.postType !== 'QUESTION') {
      throw new NotFoundException('Question not found');
    }

    const status = this.effectiveStatus(post);
    const isAsker = post.teacherId === teacherId;

    // ── SECURITY: blind-answer enforcement ────────────────────────────────
    // While OPEN: only asker sees all answers; others see only their own
    if (status === 'OPEN') {
      if (isAsker) {
        // Asker sees everything
        return this.fetchAnswersForAsker(questionId, teacherId);
      }
      // Non-askers: only their own answer
      const ownAnswer = await this.fetchOwnAnswer(questionId, teacherId);
      return {
        answers: ownAnswer ? [ownAnswer] : [],
        isBlind: true,
        totalCount: await this.prisma.communityComment.count({
          where: { postId: questionId, parentId: null },
        }),
        canAnswer: true,
      };
    }

    // CLOSED / SOLVED — all answers visible
    return this.fetchAnswersOpen(questionId, teacherId, post.questionStatus === 'SOLVED');
  }

  private async fetchAnswersForAsker(questionId: string, askerId: string) {
    const comments = await this.prisma.communityComment.findMany({
      where: { postId: questionId, parentId: null },
      orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true, verified: true } },
        reactions: { select: { teacherId: true, reaction: true } },
      },
    });

    return {
      answers: comments.map((c) => ({
        ...c,
        helpfulCount: c.reactions.filter((r) => r.reaction === 'HELPFUL').length,
        markedHelpful: c.reactions.some((r) => r.teacherId === askerId && r.reaction === 'HELPFUL'),
      })),
      isBlind: false,
      totalCount: comments.length,
      canAnswer: false, // asker can't answer their own question
    };
  }

  private async fetchOwnAnswer(questionId: string, teacherId: string) {
    const comment = await this.prisma.communityComment.findFirst({
      where: { postId: questionId, teacherId, parentId: null },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true, verified: true } },
        reactions: { select: { teacherId: true, reaction: true } },
      },
    });
    if (!comment) return null;
    return {
      ...comment,
      helpfulCount: 0,   // hidden during blind period
      markedHelpful: false,
    };
  }

  private async fetchAnswersOpen(questionId: string, teacherId: string, isSolved: boolean) {
    const comments = await this.prisma.communityComment.findMany({
      where: { postId: questionId, parentId: null },
      orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true, verified: true } },
        reactions: { select: { teacherId: true, reaction: true } },
      },
    });

    return {
      answers: comments.map((c) => ({
        ...c,
        helpfulCount: c.reactions.filter((r) => r.reaction === 'HELPFUL').length,
        markedHelpful: c.reactions.some((r) => r.teacherId === teacherId && r.reaction === 'HELPFUL'),
      })),
      isBlind: false,
      totalCount: comments.length,
      canAnswer: false,
    };
  }

  // ─── Submit answer ────────────────────────────────────────────────────────

  async submitAnswer(questionId: string, teacherId: string, dto: SubmitAnswerDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: questionId },
      select: { id: true, title: true, teacherId: true, questionStatus: true, deadline: true, postType: true },
    });

    if (!post || post.postType !== 'QUESTION') throw new NotFoundException('Question not found');

    // Server-side: reject if not OPEN
    if (!this.isOpen(post)) {
      throw new ForbiddenException('This question is closed. Answers are no longer accepted.');
    }

    // Asker cannot answer their own question
    if (post.teacherId === teacherId) {
      throw new ForbiddenException('You cannot answer your own question.');
    }

    // Prevent duplicate answer
    const existing = await this.prisma.communityComment.findFirst({
      where: { postId: questionId, teacherId, parentId: null },
    });
    if (existing) {
      throw new ConflictException('You have already submitted an answer to this question.');
    }

    const answer = await this.prisma.communityComment.create({
      data: { content: dto.content, teacherId, postId: questionId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true } },
      },
    });

    // Award points to answerer (fire and forget) - NO POINTS for answer creation
    // this.awardQaPoints(
    //   teacherId,
    //   TeacherActivityType.ANSWER_SUBMITTED,
    //   answer.id,
    //   POINT_VALUES.ANSWER_SUBMITTED,
    // );

    // Notify question asker (do NOT reveal who answered during blind period)
    const answererName = `${answer.teacher.firstName} ${answer.teacher.lastName}`;
    this.notificationService.create({
      receiverId: post.teacherId,
      title: 'Someone answered your question',
      message: `Your question "${post.title}" received a new answer.`,
      type: NotificationEvent.ANSWER_SUBMITTED,
      referenceId: questionId,
      // senderId omitted during blind period to avoid identity leak
    }).catch(() => {});

    return {
      ...answer,
      helpfulCount: 0,
      markedHelpful: false,
      message: 'Your answer has been submitted.',
    };
  }

  // ─── Helpful vote ────────────────────────────────────────────────────────

  async toggleHelpful(answerId: string, teacherId: string) {
    // Get the answer with its parent question
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: answerId },
      include: {
        post: { select: { id: true, questionStatus: true, deadline: true, postType: true } },
      },
    });

    if (!comment) throw new NotFoundException('Answer not found');
    if (comment.post.postType !== 'QUESTION') throw new BadRequestException('Helpful only applies to question answers');

    // Prevent voting on own answer
    if (comment.teacherId === teacherId) {
      throw new ForbiddenException('You cannot mark your own answer as helpful.');
    }

    // Server-side: helpful voting only allowed when question is CLOSED or SOLVED
    const status = this.effectiveStatus(comment.post);
    if (status === 'OPEN') {
      throw new ForbiddenException('Helpful voting is not available while the question is still open.');
    }

    const existing = await this.prisma.commentReaction.findUnique({
      where: { commentId_teacherId: { commentId: answerId, teacherId } },
    });

    if (existing) {
      await this.prisma.commentReaction.delete({ where: { id: existing.id } });
      return { marked: false };
    }

    await this.prisma.commentReaction.create({
      data: { commentId: answerId, teacherId, reaction: 'HELPFUL' },
    });

    // Award point to answer author (fire and forget)
    this.awardQaPoints(
      comment.teacherId,
      TeacherActivityType.ANSWER_HELPFUL,
      `${answerId}:${teacherId}`,
      POINT_VALUES.ANSWER_HELPFUL,
    );

    // Notify answer author
    const voter = await this.prisma.teacher.findUnique({
      where: { id: teacherId }, select: { firstName: true, lastName: true },
    });
    const voterName = voter ? `${voter.firstName} ${voter.lastName}` : 'Someone';
    this.notificationService.create({
      receiverId: comment.teacherId,
      senderId: teacherId,
      senderName: voterName,
      title: 'Your answer was marked helpful',
      message: `${voterName} marked your answer as helpful.`,
      type: NotificationEvent.ANSWER_HELPFUL,
      referenceId: answerId,
    }).catch(() => {});

    return { marked: true };
  }

  // ─── Select best answer (atomic transaction) — now supports toggle/unmark ──

  async selectBestAnswer(questionId: string, answerId: string, teacherId: string) {
    // Load post
    const post = await this.prisma.communityPost.findUnique({
      where: { id: questionId },
      select: { id: true, title: true, teacherId: true, questionStatus: true, deadline: true, postType: true, bestAnswerId: true },
    });

    if (!post || post.postType !== 'QUESTION') throw new NotFoundException('Question not found');

    // Only asker can select best answer
    if (post.teacherId !== teacherId) {
      throw new ForbiddenException('Only the question author can select the best answer.');
    }

    // Only allowed when CLOSED or SOLVED
    const status = this.effectiveStatus(post);
    if (status === 'OPEN') {
      throw new ForbiddenException('Best answer can only be selected after the question closes.');
    }

    // Toggle behavior: if this answer is already marked, unmark it
    if (post.bestAnswerId === answerId && status === 'SOLVED') {
      return this.unselectBestAnswer(questionId, answerId, teacherId, post.title);
    }

    // If another answer is marked, we're changing the selection
    if (status === 'SOLVED' && post.bestAnswerId !== answerId) {
      throw new ForbiddenException('A best answer has already been selected. Unmark it first to select a different one.');
    }

    // Load the answer
    const answer = await this.prisma.communityComment.findUnique({
      where: { id: answerId },
      select: { id: true, postId: true, teacherId: true },
    });

    if (!answer || answer.postId !== questionId) {
      throw new NotFoundException('Answer not found in this question.');
    }

    // Answer author cannot be the asker (extra guard)
    if (answer.teacherId === teacherId) {
      throw new ForbiddenException('You cannot select your own answer as the best answer.');
    }

    const now = new Date();

    // Atomic transaction: update answer + post + award points
    await this.prisma.$transaction(async (tx) => {
      // Unaccept any previous accepted answer
      await tx.communityComment.updateMany({
        where: { postId: questionId, isAccepted: true },
        data: { isAccepted: false },
      });

      // Mark this answer as accepted
      await tx.communityComment.update({
        where: { id: answerId },
        data: { isAccepted: true },
      });

      // Solve the question
      await tx.communityPost.update({
        where: { id: questionId },
        data: {
          questionStatus: 'SOLVED',
          bestAnswerId: answerId,
          solvedAt: now,
          isResolved: true,
        },
      });
    });

    // Award points to answerer (outside transaction, fire and forget)
    this.awardQaPoints(
      answer.teacherId,
      TeacherActivityType.BEST_ANSWER_SELECTED,
      answerId,
      POINT_VALUES.BEST_ANSWER_SELECTED,
    );

    // Award points to asker for successfully resolving
    this.awardQaPoints(
      teacherId,
      TeacherActivityType.QUESTION_RESOLVED,
      questionId,
      POINT_VALUES.QUESTION_RESOLVED,
    );

    // Notify answer author
    const asker = await this.prisma.teacher.findUnique({
      where: { id: teacherId }, select: { firstName: true, lastName: true },
    });
    const askerName = asker ? `${asker.firstName} ${asker.lastName}` : 'The question author';
    this.notificationService.create({
      receiverId: answer.teacherId,
      senderId: teacherId,
      senderName: askerName,
      title: '🏆 Your answer was selected as Best Answer!',
      message: `${askerName} selected your answer as the best answer for "${post.title}". You earned +${POINT_VALUES.BEST_ANSWER_SELECTED} points!`,
      type: NotificationEvent.BEST_ANSWER,
      referenceId: questionId,
    }).catch(() => {});

    return {
      success: true,
      questionStatus: 'SOLVED',
      bestAnswerId: answerId,
      solvedAt: now,
    };
  }

  // ─── Unselect best answer (revert SOLVED back to CLOSED) ────────────────

  private async unselectBestAnswer(questionId: string, answerId: string, teacherId: string, questionTitle: string) {
    // Atomic transaction: unmark answer + reopen question
    await this.prisma.$transaction(async (tx) => {
      // Unmark the answer
      await tx.communityComment.update({
        where: { id: answerId },
        data: { isAccepted: false },
      });

      // Revert question to CLOSED status
      await tx.communityPost.update({
        where: { id: questionId },
        data: {
          questionStatus: 'CLOSED',
          bestAnswerId: null,
          solvedAt: null,
          isResolved: false,
        },
      });
    });

    // Get answer author for notification
    const answer = await this.prisma.communityComment.findUnique({
      where: { id: answerId },
      select: { teacherId: true },
    });

    // Notify answer author that their best answer was unmarked
    if (answer) {
      const asker = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { firstName: true, lastName: true },
      });
      const askerName = asker ? `${asker.firstName} ${asker.lastName}` : 'The question author';

      this.notificationService.create({
        receiverId: answer.teacherId,
        senderId: teacherId,
        senderName: askerName,
        title: 'Best Answer Unmarked',
        message: `${askerName} unmarked your answer as the best answer for "${questionTitle}".`,
        type: NotificationEvent.REPLY, // reusing REPLY type
        referenceId: questionId,
      }).catch(() => {});
    }

    return {
      success: true,
      questionStatus: 'CLOSED',
      bestAnswerId: null,
      message: 'Best answer unmarked. Question is now closed and awaiting a new best answer selection.',
    };
  }

  // ─── Delete own answer (only if question is still OPEN) ─────────────────

  async deleteAnswer(questionId: string, answerId: string, teacherId: string) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: answerId },
      select: { id: true, postId: true, teacherId: true, isAccepted: true },
    });

    if (!comment || comment.postId !== questionId) throw new NotFoundException('Answer not found');
    if (comment.teacherId !== teacherId) throw new ForbiddenException('You can only delete your own answer.');
    if (comment.isAccepted) throw new ForbiddenException('You cannot delete the accepted best answer.');

    const post = await this.prisma.communityPost.findUnique({
      where: { id: questionId },
      select: { questionStatus: true, deadline: true },
    });

    if (post && !this.isOpen(post as any)) {
      throw new ForbiddenException('You cannot delete an answer after the question closes.');
    }

    await this.prisma.commentReaction.deleteMany({ where: { commentId: answerId } });
    await this.prisma.communityComment.delete({ where: { id: answerId } });

    return { success: true };
  }
}
