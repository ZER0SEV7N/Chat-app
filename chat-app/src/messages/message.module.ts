//src/messages/message.module.ts
//Módulo encargado de gestionar la capa de mensajes dentro de la aplicación.
//Configura las entidades necesarias, el servicio y el controlador asociado.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Channel } from '../entities/channels.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';

@Module({
  imports: [
    //Debes incluir todas las entidades que se inyectan en MessageService
    TypeOrmModule.forFeature([Message, User, Channel]),
  ],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService], //Esto permite usar MessageService desde ChatModule u otros
})
export class MessageModule {}