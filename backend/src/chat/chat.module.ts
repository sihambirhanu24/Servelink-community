import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController, ChatGroupsController, DirectMessagesController } from './chat.controller';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatAttachmentController } from './chat-attachment.controller';
import { DirectMessageAttachmentController } from './direct-message-attachment.controller';
import { NotificationModule } from '../notification/notification.module';
import { SuspensionModule } from '../suspension/suspension.module';

@Module({
  imports: [
    forwardRef(() => NotificationModule),
    SuspensionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret:
          cs.get<string>('jwtSecret') ||
          cs.get<string>('JWT_SECRET') ||
          'secret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  providers: [ChatGateway, ChatService, ChatAttachmentService],
  controllers: [ChatController, ChatGroupsController, DirectMessagesController, ChatAttachmentController, DirectMessageAttachmentController],
  exports: [ChatService, ChatAttachmentService],
})
export class ChatModule {}
