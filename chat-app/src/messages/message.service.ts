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

  async create(text: string, idUser: number, idChannel: number) {
    const user = await this.userRepository.findOne({ 
      where: { idUser }, 
      select: ['idUser', 'username', 'name'] // 🔑 importante
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const channel = await this.channelRepository.findOne({ where: { idChannel } });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    const message = this.messageRepository.create({ text, user, channel });
    const savedMessage = await this.messageRepository.save(message);

    // 🔄 Recargar la relación user para enviarla completa al frontend
    return await this.messageRepository.findOne({
      where: { idMessage: savedMessage.idMessage },
      relations: ['user'],
    });
  }

  // Obtener todos los mensajes de un canal
  async findAll(idChannel: number) {
    return await this.messageRepository.find({
      where: { channel: { idChannel } },
      relations: ['user', 'channel'],
      order: { createdAt: 'ASC' },
    });
  }

  // Buscar un mensaje específico
  async findOne(idMessage: number) {
    return await this.messageRepository.findOne({
      where: { idMessage },
      relations: ['user', 'channel'],
    });
  }

  // Editar mensaje
  async updateMessage(idMessage: number, newText: string) {
    const message = await this.findOne(idMessage);
    if (!message) throw new NotFoundException('Mensaje no encontrado');

    message.text = newText;
    return await this.messageRepository.save(message);
  }

  // Eliminar mensaje
  async removeMessage(idMessage: number) {
    const message = await this.findOne(idMessage);
    if (!message) throw new NotFoundException('Mensaje no encontrado');

    await this.messageRepository.remove(message);
    return { deleted: true, idMessage };
  }
}
