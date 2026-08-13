import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

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
}