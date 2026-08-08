import { TeacherLevelType } from "@prisma/client";

export const LEVEL_REQUIREMENTS = {
  [TeacherLevelType.LEVEL_1]: {
    next: TeacherLevelType.LEVEL_2,
    posts: 5,
    verified: true,
  },

  [TeacherLevelType.LEVEL_2]: {
    next: TeacherLevelType.LEVEL_3,
    posts: 15,
    verified: true,
  },

  [TeacherLevelType.LEVEL_3]: {
    next: TeacherLevelType.LEVEL_4,
    posts: 30,
    verified: true,
  },

  [TeacherLevelType.LEVEL_4]: {
    next: TeacherLevelType.LEVEL_5,
    posts: 60,
    verified: true,
  },

  [TeacherLevelType.LEVEL_5]: {
    next: null,
    posts: 0,
    verified: true,
  },
};