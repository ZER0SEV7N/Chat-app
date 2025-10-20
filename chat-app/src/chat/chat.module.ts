import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { Message } from 'src/entities/message.entity';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';
import { MessageModule } from 'src/messages/message.module'; 
import { AuthModule } from 'src/auth/auth.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, User]), 
    AuthModule,
    MessageModule, 
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}

