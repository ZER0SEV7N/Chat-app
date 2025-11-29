//src/chat/chat.service.ts
//Servicio encargado de manejar la lógica del chat (mensajes, canales, etc.)
//============================================================
//Importaciones necesaria
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
  //============================================================
  //Inyección de dependencias: repositorios de las entidades necesarias
  //============================================================
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>, //Repositorio de mensajes

    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>, //Repositorio de canales

    @InjectRepository(User)
    private userRepository: Repository<User>, //Repositorio de usuarios
  ) {}

  //============================================================
  //Crear un mensaje
  //============================================================
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

  //============================================================
  //Obtener todos los mensajes de un canal
  //============================================================
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

    //============================================================
    //Obtener usuario por ID
    //============================================================
    async getUserById(idUser: number) {
      const user = await this.userRepository.findOne({
        where: { idUser },
        select: ['idUser', 'username', 'name', 'email', 'phone'],
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      return user;
    }


  //============================================================
  //Crear o recuperar un canal privado (DM)
  //============================================================
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
    if (!currentUser) throw new NotFoundException('Usuario actual no encontrado');
    //BUSCAR DM EXISTENTE usando el campo 'type'
    const existingDM = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.members', 'currentUser', 'currentUser.idUser = :userId', { userId })
      .innerJoin('channel.members', 'targetUser', 'targetUser.idUser = :targetUserId', { targetUserId: targetUser.idUser 
      })
      .where('channel.type = :type', { type: 'dm' })
      .andWhere('channel.isPublic = false')
      .getOne();
    if (existingDM) {
      console.log(`✅ DM existente encontrado: ${existingDM.name}`);
      const displayName = this.getDMDisplayName(existingDM, currentUser, targetUser);
      return { channel: existingDM, displayName };
    }
    //CREAR NUEVO DM
    console.log(`🆕 Creando nuevo DM entre ${currentUser.username} y ${targetUser.username}`);
    // Ordenar alfabéticamente para que ambos usuarios tengan el mismo nombre de canal
    const orderedUsernames = [currentUser.username, targetUser.username].sort();
    // Nombre formateado tipo "#DM Moises25-ZER0SEV7N"
    const formattedName = `${orderedUsernames[0]}-${orderedUsernames[1]}`;
    const dmChannel = this.channelRepository.create({
      name: formattedName,
      description: `Chat privado entre ${currentUser.username} y ${targetUser.username}`,
      isPublic: false,
      type: 'dm', 
      members: [currentUser, targetUser],
      creator: currentUser,
    });
    const savedChannel = await this.channelRepository.save(dmChannel);
    console.log(`✅ Nuevo DM creado: ${savedChannel.name}`);
    const displayName = this.getDMDisplayName(savedChannel, currentUser, targetUser);
    return { channel: savedChannel, displayName };
    }

  /*============================================================
  Obtener nombre display para DM
  =============================================================*/
  private getDMDisplayName(channel: Channel, currentUser: User, targetUser: User): string {
    // Si el canal tiene un nombre descriptivo, usarlo
    if (channel.name.includes(currentUser.username) && channel.name.includes(targetUser.username)) {
      return `DM con ${targetUser.username}`;
    }
    // Para nombres internos, construir display name
    const otherMember = channel.members?.find(member => 
      member.idUser !== currentUser.idUser
    );
   
    return otherMember ? `DM con ${otherMember.username}` : `Chat Privado`;
  }

  //============================================================
  //Obtener todos los canales donde participa un usuario
  //============================================================
  async getUserChannels(userId: number) {
    //Buscar al usuario con sus canales
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
      relations: ['channels', 'channels.members', 'channels.creator'], //Incluir miembros para verificar
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    //Separar canales publicos y DMs
    const PublicChannels = user.channels.filter(channel =>
      channel.type === 'channel' && channel.isPublic);
     const privateChannels = user.channels.filter(channel => 
      channel.type === 'channel' && !channel.isPublic
    );
    const dmCHannels = user.channels.filter(channel =>
      channel.type === 'dm'
    );
    //Formatear DMs para mostrar nombre del otro usuario
    const formattedDMChannels = dmCHannels.map(dm => {
      const otherMember = dm.members.find(member => member.idUser !== userId);
      return {
        ...dm,
        displayName: otherMember ? `DM con ${otherMember.username}` : `Chat Privado`,
        isDM: true
      };
    });
    //Para canales privados, verificar que el usuario actual sea miembro
    return {  
      PublicChannels,
      privateChannels,
      dmChannels: formattedDMChannels,
      allChannels: [...PublicChannels, ...privateChannels, ...formattedDMChannels]
    };
  }
  //============================================================
  //Obtener todos los usuarios (en AddUserModal)
  //============================================================
  async getAllUsers(currentUserId: number) {
    const users = await this.userRepository.find({
      where: {
        idUser: Not(currentUserId),
      },
      select: ['idUser', 'username', 'name', 'email', 'phone', 'createdAt'],
      order: {username: 'ASC'},
    });
    return users;
  }
    
  //============================================================
  //Obtener DMs específicos de un usuario
  //============================================================
  async getUserDMs(userId: number) {
    const dms = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.members', 'user', 'user.idUser = :userId', { userId })
      .leftJoinAndSelect('channel.members', 'members')
      .where('channel.type = :type', { type: 'dm' })
      .andWhere('channel.isPublic = false')
      .getMany();
    
    return dms.map(dm => {
      const otherMember = dm.members.find(member => member.idUser !== userId);
      return {
        ...dm,
        displayName: otherMember ? `DM con ${otherMember.username}` : 'Chat Privado',
        otherUser: otherMember
      };
    });
  }

  /*===========================================================================
  GET /chat/my-dms
  Obtener DMs con información completa incluyendo mensajes y detalles extendidos
===========================================================================*/
async getUserDMsWithMessages(userId: number) {
  const dms = await this.channelRepository
    .createQueryBuilder('channel')
    .innerJoin('channel.members', 'user', 'user.idUser = :userId', { userId })
    .leftJoinAndSelect('channel.members', 'members')
    .leftJoinAndSelect('channel.messages', 'messages')
    .leftJoinAndSelect('messages.user', 'messageUser', 'messageUser.idUser IS NOT NULL')
    .where('channel.type = :type', { type: 'dm' })
    .andWhere('channel.isPublic = false')
    .orderBy('messages.createdAt', 'ASC')
    .getMany();
  
  return dms.map(dm => {
    const otherMember = dm.members.find(member => member.idUser !== userId);
    const lastMessage = dm.messages.length > 0 ? dm.messages[dm.messages.length - 1] : null;
    
    return {
      ...dm,
      displayName: otherMember ? `DM con ${otherMember.username}` : 'Chat Privado',
      otherUser: otherMember,
      lastMessage: lastMessage ? {
        id: lastMessage.idMessage,
        text: lastMessage.text,
        createdAt: lastMessage.createdAt,
        user: {
          idUser: lastMessage.user?.idUser,
          username: lastMessage.user?.username
        }
      } : null,
      unreadCount: 0 // Puedes agregar lógica para contar mensajes no leídos
    };
  });
}

  //============================================================
  //Eliminar DM (solo si ambos usuarios lo desean)
  //============================================================
  async deleteDM(channelId: number, userId: number) {
    const dm = await this.channelRepository.findOne({
      where: { idChannel: channelId, type: 'dm' },
      relations: ['members']
    });
    if (!dm) throw new NotFoundException('DM no encontrado');
    //Verificar que el usuario es miembro del DM
    const isMember = dm.members.some(member => member.idUser === userId);
    if (!isMember) throw new NotFoundException('No tienes acceso a este DM');
    //Eliminar el DM
    await this.channelRepository.remove(dm);
    return { message: 'Chat privado eliminado correctamente' };
  }

  //============================================================
  //Obtener todos los canales DM del usuario (alternativa más específica)
  //============================================================
  async getDMById(channelId: number, userId: number){
    return this.channelRepository.findOne({
      where: {
        idChannel: channelId,
        type: 'dm',
        members: { idUser: userId}//Verificar que el usuario es miembro
      },
      relations: ['members', 'messages', 'messages.user']
    });
  }

  //============================================================
  //Buscar un DM específico por username del otro usuario
  //============================================================
  async getDMByUsername(userId: number, targetUsername: string) {
    // Implementación para buscar DM por username
    const userDMs = await this.getUserDMs(userId);
    
    return userDMs.find(dm => 
      dm.members.some(member => 
        member.username === targetUsername && member.idUser !== userId
      )
    );
  }
}