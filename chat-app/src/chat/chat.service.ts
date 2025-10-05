import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  //Crear mensaje
  async createMessage(userId: number, channelId: number, text: string) {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    const message = this.messageRepository.create({ text, user, channel });
    return this.messageRepository.save(message);
  }
  //Obtener mensajes de un canal
  async getMessages(channelId: number) {
    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    return await this.messageRepository.find({
      where: { channel: { idChannel: channelId } },
      relations: ['user'], // Incluir la relación con el usuario
      order: { createdAt: 'ASC' }, // Ordenar por fecha de creación ascendente
    });
  }
  //Crear o recuperar un MD entre dos usuarios
  async getOrCreatePrivateChannel(userId: number, targetUsername: string) {
    const targetUser = await this.userRepository.findOne({ where: { username: targetUsername  } });
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');


    //Buscar si ya existe un canal privado entre los dos usuarios
    let channel = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('channel.isPrivate = true')
      .andWhere('member.id IN (:...ids)', { ids: [userId, targetUser.idUser] })
      .getOne();

    if (!channel) {
      channel = this.channelRepository.create({
        name: `dm-${userId}-${targetUser.idUser}`,
        isPublic: true,
        members: [{ idUser: userId }, { idUser: targetUser.idUser }],
      });
      await this.channelRepository.save(channel);
    }

    return channel;
  }

  //Canales de un usuario
  async getUserChannels(userId: number) {
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
      relations: ['channels'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return user.channels;
  }
}
