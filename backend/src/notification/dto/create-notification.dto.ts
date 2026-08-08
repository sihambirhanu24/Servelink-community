import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationEvent } from '../notification.types';

export class CreateNotificationDto {
  @IsString()
  receiverId: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationEvent)
  type: NotificationEvent;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
