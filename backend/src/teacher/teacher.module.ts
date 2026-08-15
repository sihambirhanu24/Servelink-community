import { Module } from "@nestjs/common";
import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";
import { VerificationService } from "./verification.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [TeacherController],
  providers: [TeacherService, VerificationService],
  exports: [TeacherService, VerificationService],
})
export class TeacherModule {}