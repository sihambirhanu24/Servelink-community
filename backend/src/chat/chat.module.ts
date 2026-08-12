import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController, ChatGroupsController } from './chat.controller';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatAttachmentController } from './chat-attachment.controller';

@Module({
  imports: [
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
  controllers: [ChatController, ChatGroupsController, ChatAttachmentController],
  exports: [ChatService, ChatAttachmentService],
})
export class ChatModule {}
