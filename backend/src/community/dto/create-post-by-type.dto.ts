import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostByTypeDto {
  /**
   * The community type context the teacher is posting from.
   * The backend resolves the actual communityId — never trusted from client.
   */
  @IsString()
  @IsNotEmpty()
  communityType: string; // NETWORK | SCHOOL | WOREDA | ZONE | REGION | NATIONAL

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(PostType)
  @IsOptional()
  postType?: PostType;

  /**
   * Optional deadline for questions (ISO 8601 DateTime string).
   * If provided, the post is treated as a QUESTION with blind answer period.
   */
  @IsString()
  @IsOptional()
  deadline?: string;
}
