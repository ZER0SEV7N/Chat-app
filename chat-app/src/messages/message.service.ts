import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Channel } from '../entities/channels.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  // ============================================================
  // Crear un mensaje (con relación a usuario y canal)
  // ============================================================
  async create(text: string, idUser: number, idChannel: number): Promise<Message> {
    const user = await this.userRepository.findOne({ where: { idUser } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const channel = await this.channelRepository.findOne({ where: { idChannel } });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    const newMessage = this.messageRepository.create({
      text,
      user,
      channel,
    });

    return this.messageRepository.save(newMessage);
  }

  // ============================================================
  // Obtener historial de mensajes (por canal)
  // ============================================================
  async findAll(idChannel: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: { channel: { idChannel } },
      order: { createdAt: 'ASC' },
      relations: ['user', 'channel'],
    });
  }
}
