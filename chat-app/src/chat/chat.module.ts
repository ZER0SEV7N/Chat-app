//src/chat/chat.module.ts
//Módulo principal del sistema de chat
//Este módulo agrupa el WebSocket Gateway, el controlador REST
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
import { ChannelsService } from 'src/channels/channels.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, User]), //Entidades a utilizar
    AuthModule,
    MessageModule, 
  ],
  providers: [ChatGateway, ChatService, ChannelsService],
  controllers: [ChatController],
})
export class ChatModule {}

