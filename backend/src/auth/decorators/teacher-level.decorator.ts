import { SetMetadata } from '@nestjs/common';
import { TeacherLevelType } from '@prisma/client';

export const TEACHER_LEVEL_KEY = 'teacher_level';

export const TeacherLevel = (
  ...levels: TeacherLevelType[]
) => SetMetadata(TEACHER_LEVEL_KEY, levels);