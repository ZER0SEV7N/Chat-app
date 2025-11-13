// ============================================================
// 📁 src/chat/chat.service.ts
// Servicio encargado de manejar la lógica del chat (mensajes, canales, etc.)
// ============================================================

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ChatService {
  // ============================================================
  // Inyección de dependencias: repositorios de las entidades necesarias
  // ============================================================
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>, //Repositorio de mensajes

    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>, //Repositorio de canales

    @InjectRepository(User)
    private userRepository: Repository<User>, //Repositorio de usuarios
  ) {}

  // ============================================================
  // 📩 Crear un mensaje
  // ============================================================
  async createMessage(userId: number, channelId: number, text: string) {
    //Buscar el usuario que envía el mensaje
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    //Buscar el canal donde se enviará el mensaje
    const channel = await this.channelRepository.findOne({
      where: { idChannel: channelId },
    });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    //Crear el mensaje con la información proporcionada
    const message = this.messageRepository.create({ text, user, channel });

    //Guardar el mensaje en la base de datos y retornarlo
    return this.messageRepository.save(message);
  }

  // ============================================================
  // 💬 Obtener todos los mensajes de un canal
  // ============================================================
  async getMessages(channelId: number) {
    //Verificar que el canal exista
    const channel = await this.channelRepository.findOne({
      where: { idChannel: channelId },
    });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    //Buscar los mensajes relacionados con el canal
    return await this.messageRepository.find({
      where: { channel: { idChannel: channelId } },
      relations: ['user'], //Incluir el usuario que envió cada mensaje
      order: { createdAt: 'ASC' }, //Mostrar los más antiguos primero
    });
  }

    // ============================================================
    // 👤 Obtener usuario por ID
    // ============================================================
    async getUserById(idUser: number) {
      const user = await this.userRepository.findOne({
        where: { idUser },
        select: ['idUser', 'username', 'name', 'email'],
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      return user;
    }


  // ============================================================
  // Crear o recuperar un canal privado (DM) - CORREGIDO
  // ============================================================
  async getOrCreatePrivateChannel(userId: number, targetUsername: string) {
    //Buscar el usuario objetivo (con quien se chatea)
    const targetUser = await this.userRepository.findOne({
      where: { username: targetUsername },
    });
    if (!targetUser) throw new NotFoundException('Usuario destino no encontrado');

    //Buscar el usuario actual
    const currentUser = await this.userRepository.findOne({
      where: { idUser: userId },
    });
    if (!currentUser)
      throw new NotFoundException('Usuario actual no encontrado');

    // 🔒 CONSULTA CORREGIDA: Buscar canal que tenga EXACTAMENTE a ambos usuarios
    let channel = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.members', 'member1')
      .innerJoin('channel.members', 'member2')
      .where('channel.isPublic = false')
      .andWhere('member1.idUser = :userId', { userId })
      .andWhere('member2.idUser = :targetUserId', { targetUserId: targetUser.idUser })
      .getOne();

    // Si no existe, crear un nuevo canal privado (DM)
    if (!channel) {
      console.log(`🆕 Creando nuevo DM entre ${currentUser.username} y ${targetUser.username}`);
      
      channel = this.channelRepository.create({
        name: `DM ${currentUser.username}-${targetUser.username}`,
        description: `Chat privado entre ${currentUser.username} y ${targetUser.username}`,
        isPublic: false,
        members: [currentUser, targetUser],
        creator: currentUser,
      });
      await this.channelRepository.save(channel);
      
      console.log(`✅ Nuevo DM creado: ${channel.name}`);
    } else {
      console.log(`✅ DM existente encontrado: ${channel.name}`);
    }

    // Definir el nombre que verá el usuario actual
    const displayName = `DM ${targetUser.username}`;

    return { channel, displayName };
  }

  // ============================================================
  // Obtener todos los canales donde participa un usuario
  // ============================================================
  async getUserChannels(userId: number) {
    // Buscar al usuario con sus canales
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
      relations: ['channels', 'channels.members'], // Incluir miembros para verificar
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 🔒 Filtrar canales privados para asegurar que el usuario es miembro
    const filteredChannels = user.channels.filter(channel => {
      if (channel.isPublic) return true;
      
      // Para canales privados, verificar que el usuario actual sea miembro
      return channel.members.some(member => member.idUser === userId);
    });

    return filteredChannels;
  }
  //============================================================
  //Obtener todos los usuarios (en AddUserModal)
    async getAllUsers(currentUserId: number) {
    const users = await this.userRepository.find({
      where: {
        idUser: Not(currentUserId),
      },
      select: ['idUser', 'username', 'name', 'email', 'createdAt'],
      order: {
        username: 'ASC',
      },
    });
    return users;
  }
}
