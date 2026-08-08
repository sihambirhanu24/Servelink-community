import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This is a very helpful post!',
    description: 'The content of the comment',
  })
  @IsString()
  content: string;
}