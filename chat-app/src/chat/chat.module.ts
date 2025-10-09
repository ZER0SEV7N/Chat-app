import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; <-- Asumo que ya tenías esto
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MessageModule } from '../messages/message.module'; // <-- ¡IMPORTA ESTO!
// import { Chat } from '../database/entities/chat.entity'; <-- Si tienes una entidad Chat

@Module({
  imports: [
    MessageModule, // <-- ¡AÑADE ESTO!
    // TypeOrmModule.forFeature([Chat]), // Si es necesario
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule { }