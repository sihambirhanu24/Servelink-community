import { IsString, IsNotEmpty } from 'class-validator';

export class AddReactionDto {
  @IsString()
  @IsNotEmpty()
  reaction: string; // emoji like "👍", "❤️", "😂", etc.
}
