import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { FileModule } from './file/file.module';
import { AdminModule } from './admin/admin.module';
import { PostModule } from './post/post.module';
import { CommunityModule } from './community/community.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { MembershipModule } from './membership/membership.module';
import { ProfileModule } from './profile/profile.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EngagementModule } from './engagement/engagement.module';
import { TeacherModule } from "./teacher/teacher.module";
import { DatabaseService } from './database/database.service';
import { ChatModule } from './chat/chat.module';
import { ProgressModule } from './progress/progress.module';

import { MailModule } from "./mail/mail.module";
import { ConfigModule } from '@nestjs/config'

import configuration from './config/configuration';

import { validationSchema } from './config/validation';
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ".env",
    load: [configuration],
    validationSchema,
  }),

  ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), "uploads"),
    serveRoot: "/uploads",
  }),

  PrismaModule,
  AuthModule,
  CommunityModule,
  NotificationModule,
  MembershipModule,
  ProfileModule,
  DashboardModule,
  EngagementModule,
  PostModule,
  AdminModule,
  FileModule,
  SharedModule,
  TeacherModule,
  ChatModule,
  ProgressModule,

  MailModule,
],
providers: [DatabaseService],
})
export class AppModule {}