import { IsEnum, IsString } from 'class-validator';

export enum TeacherLevelType {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  LEVEL_4 = 'LEVEL_4',
  LEVEL_5 = 'LEVEL_5',
}

export class UpgradeLevelDto {
  @IsString()
  teacherId: string;

  @IsEnum(TeacherLevelType)
  level: TeacherLevelType;
}
