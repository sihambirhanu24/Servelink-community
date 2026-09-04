import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CommunityType,
  PostModerationStatus,
  PostType,
  TeacherLevelType,
} from '@prisma/client';

export const POST_REPORT_FILTERS = [
  'NO_REPORTS',
  'REPORTED',
  'UNRESOLVED',
  'RESOLVED',
] as const;
export type PostReportFilter = (typeof POST_REPORT_FILTERS)[number];

export const POST_SORT_OPTIONS = [
  'newest',
  'oldest',
  'most_reported',
  'most_engaged',
] as const;
export type PostSortOption = (typeof POST_SORT_OPTIONS)[number];

/** Kept identical to the values the existing admin UI already sends. */
export const POST_MODERATION_ACTIONS = ['HIDDEN', 'REMOVE', 'RESTORE'] as const;
export type PostModerationAction = (typeof POST_MODERATION_ACTIONS)[number];

export const REPORT_RESOLUTION_ACTIONS = ['RESOLVE', 'DISMISS'] as const;
export type ReportResolutionAction = (typeof REPORT_RESOLUTION_ACTIONS)[number];

export class AdminPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  communityId?: string;

  @IsOptional()
  @IsEnum(CommunityType)
  communityType?: CommunityType;

  @IsOptional()
  @IsEnum(TeacherLevelType)
  teacherLevel?: TeacherLevelType;

  @IsOptional()
  @IsEnum(PostModerationStatus)
  moderationStatus?: PostModerationStatus;

  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(POST_REPORT_FILTERS)
  reportStatus?: PostReportFilter;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(POST_SORT_OPTIONS)
  sortBy: PostSortOption = 'newest';
}

export class ModeratePostDto {
  @IsIn(POST_MODERATION_ACTIONS)
  action: PostModerationAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BulkModeratePostsDto extends ModeratePostDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];
}

export class ResolvePostReportDto {
  @IsIn(REPORT_RESOLUTION_ACTIONS)
  action: ReportResolutionAction;
}
