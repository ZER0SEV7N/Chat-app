import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MessageService } from '../messages/message.service';
import { Message } from '../entities/message.entity';
import { Channel } from '../entities/channels.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module'; // 👈 IMPORTA AQUÍ
import { ChannelsModule } from '../channels/channels.module';
import { ChatController } from './chat.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, User]),
    AuthModule, // 👈 ASÍ TIENES DISPONIBLE JwtService
    ChannelsModule,
  ],
  providers: [ChatGateway, ChatService, MessageService],
  controllers: [ChatController],
})
export class ChatModule {}