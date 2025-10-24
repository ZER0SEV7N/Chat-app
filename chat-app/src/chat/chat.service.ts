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
  ) { }

  // ============================================================
  // Crear mensaje
  // ============================================================
  async createMessage(userId: number, channelId: number, text: string) {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    const message = this.messageRepository.create({ text, user, channel });
    return this.messageRepository.save(message);
  }

  // ============================================================
  // Obtener mensajes de un canal
  // ============================================================
  async getMessages(channelId: number) {
    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    return await this.messageRepository.find({
      where: { channel: { idChannel: channelId } },
      relations: ['user'], // incluir el usuario
      order: { createdAt: 'ASC' },
    });
  }

  // ============================================================
  // Crear o recuperar un canal privado (DM)
  // ============================================================
  async getOrCreatePrivateChannel(userId: number, targetUsername: string) {
    const targetUser = await this.userRepository.findOne({
      where: { username: targetUsername },
    });
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');

    // Buscar si ya existe un canal privado entre los dos usuarios
    let channel = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('channel.isPublic = false')
      .andWhere('member.idUser IN (:...ids)', { ids: [userId, targetUser.idUser] })
      .getOne();

    // Si no existe, crear nuevo
    if (!channel) {
      channel = this.channelRepository.create({
        name: `dm-${userId}-${targetUser.idUser}`,
        isPublic: false,
        members: [{ idUser: userId }, { idUser: targetUser.idUser }],
      });
      await this.channelRepository.save(channel);
    }

    return channel;
  }

  // ============================================================
  // Obtener canales de un usuario
  // ============================================================
  async getUserChannels(userId: number) {
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
      relations: ['channels'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return user.channels;
  }

  // ============================================================
  // Obtener usuarios que pertenecen a un canal
  // ============================================================
  async getUsersInChannel(idChannel: number) {
    const channel = await this.channelRepository.findOne({
      where: { idChannel },
      relations: ['members'], // asegúrate de que 'members' es la relación con usuarios
    });

    if (!channel) {
      throw new NotFoundException(`Canal con ID ${idChannel} no encontrado`);
    }

    return channel.members; // devuelve todos los usuarios miembros del canal
  }

  // ============================================================
  // Eliminar un canal (y sus mensajes)
  // ============================================================
  async removeChannel(idChannel: number) {
    const channel = await this.channelRepository.findOne({
      where: { idChannel },
      relations: ['messages'],
    });

    if (!channel) {
      throw new NotFoundException(`Canal con ID ${idChannel} no encontrado`);
    }

    await this.channelRepository.remove(channel);
    return { message: `Canal ${idChannel} eliminado correctamente` };
  }
}
