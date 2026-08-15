import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RejectTeacherDto {
  @ApiProperty({
    example: 'The uploaded teacher identification document is not valid.',
    description: 'Reason shown to the teacher so they can correct and resubmit',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
