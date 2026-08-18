import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ProgressModule } from "../progress/progress.module";
import { VerificationModule } from "../verification/verification.module";
import { EngagementController } from "./engagement.controller";
import { EngagementService } from "./engagement.service";

@Module({
  imports: [PrismaModule, ProgressModule, VerificationModule],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}