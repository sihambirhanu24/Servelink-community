import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  @ValidateIf((o) => !o.attachmentUrls || o.attachmentUrls.length === 0)
  @IsNotEmpty()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}
