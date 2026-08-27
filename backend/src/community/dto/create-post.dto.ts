import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";
import { PostType } from "@prisma/client";

export class CreatePostDto {

  @ApiProperty({
    example: "Need help with NestJS",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: "How can I use Prisma relations?",
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    example: "community-id",
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiProperty({
    example: "category-id",
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: "DISCUSSION",
    required: false,
    enum: PostType
  })
  @IsEnum(PostType)
  @IsOptional()
  postType?: PostType;
}