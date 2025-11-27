//src/channels/channels.module.ts
//Módulo encargado de agrupar toda la funcionalidad relacionada con los canales.
//Este módulo gestiona la lógica y rutas para la creación, administración y manejo
//de canales en la aplicación (públicos y privados).
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { Channel } from '../entities/channels.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User])], //Permite registrar las entidades que se utilizaran
  controllers: [ChannelsController], //Define los endpoints
  providers: [ChannelsService],
  exports: [ChannelsService]
})
export class ChannelsModule {}
