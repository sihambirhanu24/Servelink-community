import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ProgressModule } from "../progress/progress.module";
import { VerificationModule } from "../verification/verification.module";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";

@Module({
  imports: [PrismaModule, ProgressModule, VerificationModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}