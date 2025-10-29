//Importaciones necesarias
import { Injectable, NotFoundException,ForbiddenException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
//Servicio para manejar la lógica del chat
export class ChatService {
  //Inyección de dependencias: repositorios de las entidades necesarias
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>, //Repositorio de mensajes

    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>, //Repositorio de canales

    @InjectRepository(User)
    private userRepository: Repository<User>, //Repositorio de usuarios
  ) {}

  // ============================================================
  // Crear mensaje
  // ============================================================
  async createMessage(userId: number, channelId: number, text: string) {
    //Buscar el usuario que envía el mensaje
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    //Verificar si el usuario existe
    if (!user) throw new NotFoundException('Usuario no encontrado');

    //Buscar el canal donde se enviará el mensaje
    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    //Verificar si el canal existe
    if (!channel) throw new NotFoundException('Canal no encontrado');

    //Crear el mensaje con la información proporcionada
    const message = this.messageRepository.create({ text, user, channel });

    //Guardar el mensaje en la base de datos y retornarlo
    return this.messageRepository.save(message);
  }

  // ============================================================
  // Obtener mensajes de un canal
  // ============================================================
  async getMessages(channelId: number) {
    //Verificar que el canal exista
    const channel = await this.channelRepository.findOne({ where: { idChannel: channelId } });
    //Si el canal no existe, lanzar excepción
    if (!channel) throw new NotFoundException('Canal no encontrado');

    //Buscar todos los mensajes relacionados al canal, incluyendo el usuario que los envió
    return await this.messageRepository.find({
      where: { channel: { idChannel: channelId } }, //Filtrar por canal
      relations: ['user'], //Incluir la relación con el usuario
      order: { createdAt: 'ASC' }, //Ordenar los mensajes por fecha (más antiguos primero)
    });
  }

  // ============================================================
  // Crear o recuperar un canal privado (DM)
  // ============================================================
  async getOrCreatePrivateChannel(userId: number, targetUsername: string) {
    //Buscar el usuario destino por su nombre de usuario
    const targetUser = await this.userRepository.findOne({ where: { username: targetUsername } });
    //Si no existe el usuario objetivo, lanzar excepción
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');

    //Buscar el usuario actual por su ID
    const currentUser = await this.userRepository.findOne({ where: { idUser: userId } });
    //Verificar que el usuario actual exista (por seguridad)
    if (!currentUser) throw new NotFoundException('Usuario actual no encontrado');

    //Buscar si ya existe un canal privado entre ambos usuarios
    let channel = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('channel.isPublic = false')
      .andWhere('member.idUser IN (:...ids)', { ids: [userId, targetUser.idUser] })
      .getOne();

    //Si el canal no existe, crear uno nuevo
    if (!channel) {
      //Definir los datos del nuevo canal privado (DM)
      channel = this.channelRepository.create({
        name: `DM ${currentUser.username}-${targetUser.username}`,
        description: `Chat privado entre ${currentUser.username} y ${targetUser.username}`,
        isPublic: false,
        members: [currentUser, targetUser],
        creator: currentUser,
      });
      await this.channelRepository.save(channel);
    }

    //Definir el nombre que se mostrará dependiendo de quién acceda al canal
    const displayName =
      //Si el usuario actual es el creador, mostrar el nombre del otro usuario
      channel.name.includes(`${currentUser.username}-${targetUser.username}`) ||
      channel.name.includes(`${targetUser.username}-${currentUser.username}`)
        ? `DM ${targetUser.username}` //Mostrar "DM + nombre del otro usuario"
        : channel.name; //Si no aplica, mostrar el nombre del canal

    //Retornar el canal y el nombre visible
    return { channel, displayName };
  }

  // ============================================================
  // Obtener canales de un usuario
  // ============================================================
  async getUserChannels(userId: number) {
    //Buscar al usuario e incluir sus canales
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
      relations: ['channels'], //Incluir relación con canales
    });

    //Si el usuario no existe, lanzar excepción
    if (!user) throw new NotFoundException('Usuario no encontrado');

    //Retornar los canales del usuario
    return user.channels;
  }
}
