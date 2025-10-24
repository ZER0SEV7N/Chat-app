import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
//Servicio para manejar la lógica del chat
export class ChatService {
  //Inyectar los repositorios necesarios
  constructor(
    //Repositorio de mensajes
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    //Repositorio de canales
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    //Repositorio de usuarios
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  // ============================================================
  // Crear mensaje
  // ============================================================
  async createMessage(userId: number, channelId: number, text: string) {
    //Buscar el usuario y el canal
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    //Si no existe el usuario, lanzar error
    if (!user) throw new NotFoundException('Usuario no encontrado');
    //Buscar el canal
    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    //Si no existe el canal, lanzar error
    if (!channel) throw new NotFoundException('Canal no encontrado');
    //Crear y guardar el mensaje
    const message = this.messageRepository.create({ text, user, channel });
    //Guardar el mensaje en la base de datos
    return this.messageRepository.save(message);
  }

  // ============================================================
  // Obtener mensajes de un canal
  // ============================================================
  async getMessages(channelId: number) {
    //Verificar que el canal existe
    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    //Objetar error si no existe
    if (!channel) throw new NotFoundException('Canal no encontrado');
    //Buscar y retornar los mensajes del canal
    return await this.messageRepository.find({
      where: { channel: { idChannel: channelId } }, //Filtrar por canal
      relations: ['user'], //Incluir la relación con el usuario
      order: { createdAt: 'ASC' }, //Ordenar por fecha de creación ascendente
    });
  }

  // ============================================================
  // Crear o recuperar un canal privado (DM)
  // ============================================================
  async getOrCreatePrivateChannel(userId: number, targetUsername: string) {
    //comprobar el usuario objetivo por su username
    const targetUser = await this.userRepository.findOne({ where: { username: targetUsername  } });
    //Mostrar error si no existe
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');
    //Comprobar que el usuario actual existe
    const currentUser = await this.userRepository.findOne({ where: { idUser: userId } });
    //Mostrar error si no existe el usuario actual (Dudo mucho que llegue a pasar pero igualmemnte esta ahi xd)  
    if (!currentUser) throw new NotFoundException('Usuario actual no encontrado');
    //Buscar si ya existe un canal privado entre los dos usuarios
    let channel = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('channel.isPublic = false')
      .andWhere('member.idUser IN (:...ids)', { ids: [userId, targetUser.idUser] })
      .getOne();
    //Si no existe, crear el canal privado
    if (!channel) {
      //Definir el nombre del canal como "dm-usuario"
      channel = this.channelRepository.create({
        name: `dm-${targetUser.username}-${currentUser.username}`, //Nombre del canal
        description: `Chat privado entre ${currentUser.username} y ${targetUser.username}`, //Descripción del canal
        isPublic: false, //Canal privado
        members: [{ idUser: userId }, { idUser: targetUser.idUser }], //Miembros del canal
      });
      await this.channelRepository.save(channel); //Guardar el canal en la base de datos
    }
    //Mostrar diferentes nombre del usuario dependiendo de quien lo creo
    const displayName = 
          //Mostrar el nombre del canal si eres el creador
          channel.name.includes(`${currentUser.username}-${targetUser.username}`) ||
          //Mostrar el nombre del otro usuario si eres el receptor
          channel.name.includes(`${targetUser.username}-${currentUser.username}`)
          //Mostrar el nombre del otro usuario
          ? `DM ${targetUser.username}`: channel.name;
    //Retornar el canal y el nombre a mostrar
    return {channel, displayName};
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
