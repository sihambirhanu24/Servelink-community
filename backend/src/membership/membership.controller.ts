import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VerifiedTeacherGuard } from "../auth/guards/verified-teacher.guard";
import { MembershipService } from "./membership.service";

@Controller("membership")
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
  ) {}

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Post(":communityId")
  join(
    @Param("communityId") communityId: string,
    @Req() req,
  ) {
    return this.membershipService.joinCommunity(
      req.user.sub,
      communityId,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Delete(":communityId")
  leave(
    @Param("communityId") communityId: string,
    @Req() req,
  ) {
    return this.membershipService.leaveCommunity(
      req.user.sub,
      communityId,
    );
  }

  @Get(":communityId/members")
  members(
    @Param("communityId") communityId: string,
  ) {
    return this.membershipService.getMembers(
      communityId,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Get(":communityId/check")
  check(
    @Param("communityId") communityId: string,
    @Req() req,
  ) {
    return this.membershipService.isMember(
      req.user.sub,
      communityId,
    );
  }
}