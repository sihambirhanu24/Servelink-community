import {
  CommunityType,
  TeacherLevelType,
} from "@prisma/client";

export function canJoinCommunity(
  level: TeacherLevelType,
  communityType: CommunityType,
) {
  switch (level) {
    case TeacherLevelType.LEVEL_1:
      return communityType === CommunityType.SCHOOL;

    case TeacherLevelType.LEVEL_2:
      return (
        communityType === CommunityType.SCHOOL ||
        communityType === CommunityType.WOREDA
      );

    case TeacherLevelType.LEVEL_3:
      return (
        communityType === CommunityType.SCHOOL ||
        communityType === CommunityType.WOREDA ||
        communityType === CommunityType.ZONE
      );

    case TeacherLevelType.LEVEL_4:
      return (
        communityType === CommunityType.SCHOOL ||
        communityType === CommunityType.WOREDA ||
        communityType === CommunityType.ZONE ||
        communityType === CommunityType.REGION
      );

    case TeacherLevelType.LEVEL_5:
      return true;

    default:
      return false;
  }
}