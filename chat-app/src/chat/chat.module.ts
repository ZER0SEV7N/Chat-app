import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Message } from 'src/entities/message.entity';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';
import { MessageModule } from 'src/messages/message.module'; 
import { AuthModule } from 'src/auth/auth.module';
import { ChatController } from './chat.controller';
import { ChannelsModule } from 'src/channels/channels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, User]), 
    AuthModule,
    MessageModule,
    ChannelsModule, 
  ],
  providers: [ChatGateway, ChatService], 
  controllers: [ChatController],
})
export class ChatModule {}