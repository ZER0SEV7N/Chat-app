//src/messages/message.service.ts
//Servicio encargado de gestionar la lógica de negocio relacionada con los mensajes.
//Incluye creación, edición, obtención y eliminación de mensajes dentro de los canales.

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { User } from 'src/entities/user.entity';
import { Channel } from 'src/entities/channels.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) { }

  /*===========================================================================
    Crear un mensaje dentro de un canal
  ===========================================================================*/
  async create(text: string, idUser: number, idChannel: number) {
    //Buscar usuario
    const user = await this.userRepository.findOne({ 
      where: { idUser }, 
      select: ['idUser', 'username', 'name'] //importante
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    //Buscar canal
    const channel = await this.channelRepository.findOne({ where: { idChannel } });
    if (!channel) throw new NotFoundException('Canal no encontrado');
    //Crear mensaje
    const message = this.messageRepository.create({ text, user, channel });
    const savedMessage = await this.messageRepository.save(message);
    //Recargar la relación user para enviarla completa al frontend
    return await this.messageRepository.findOne({
      where: { idMessage: savedMessage.idMessage },
      relations: ['user'],
    });
  }

  /*===========================================================================
    Buscar un mensaje por ID
  ===========================================================================*/
  async findAll(idChannel: number) {
    return await this.messageRepository.find({
      where: { channel: { idChannel } },
      relations: ['user', 'channel'],
      order: { createdAt: 'ASC' },
    });
  }

  /*===========================================================================
    Buscar un mensaje por ID
  ===========================================================================*/
  async findOne(idMessage: number) {
    return await this.messageRepository.findOne({
      where: { idMessage },
      relations: ['user', 'channel'],
    });
  }

  /*===========================================================================
    Actualizar el contenido de un mensaje
  ===========================================================================*/
  async updateMessage(idMessage: number, newText: string) {
    const message = await this.findOne(idMessage);
    if (!message) throw new NotFoundException('Mensaje no encontrado');

    message.text = newText;
    return await this.messageRepository.save(message);
  }

  /*===========================================================================
    Eliminar un mensaje
  ===========================================================================*/
  async removeMessage(idMessage: number) {
    const message = await this.findOne(idMessage);
    if (!message) throw new NotFoundException('Mensaje no encontrado');

    await this.messageRepository.remove(message);
    return { deleted: true, idMessage };
  }
}
