import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class EditMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;
}
