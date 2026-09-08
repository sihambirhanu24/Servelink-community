import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Optional feedback text',
    example: 'Very helpful and patient mentor!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
