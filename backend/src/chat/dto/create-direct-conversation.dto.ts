import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({
    description: 'ID of the teacher to start a conversation with',
    example: 'clx123abc456def',
  })
  @IsString()
  @IsNotEmpty()
  targetTeacherId: string;
}
