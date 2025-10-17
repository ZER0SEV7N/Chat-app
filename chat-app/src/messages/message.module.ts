import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Channel } from '../entities/channels.entity';
import { MessageService } from './message.service';

@Module({
  imports: [
    // 👇 Debes incluir todas las entidades que se inyectan en MessageService
    TypeOrmModule.forFeature([Message, User, Channel]),
  ],
  providers: [MessageService],
  exports: [MessageService], // 👈 Esto permite usar MessageService desde ChatModule u otros
})
export class MessageModule {}
