//src/chat/chat.gateway.ts
//Este gateway gestiona toda la comunicación en tiempo real de la aplicación.
//Maneja conexión/desconexión de usuarios, salas, envío/recepción de mensajes,
//creación de canales, DMs, notificaciones globales y sincronización de usuarios online.
//Se integra con Socket.IO y usa JWT para autenticar conexiones entrantes.
//Importaciones
import {
  WebSocketGateway, SubscribeMessage,
  MessageBody, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
  ConnectedSocket, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateChatDto } from '../auth/chatDto/create-chat.dto';
import { UpdateChatDto } from '../auth/chatDto/update-chat.dto';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from '../messages/message.service';
import { ChannelsService } from '../channels/channels.service';

//======================================================================================
//Configuración del Gateway WebSocket
//======================================================================================
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  //Lista de usuarios conectados (clave: idUser, valor: username)
  private onlineUsers: Map<number, string> = new Map();
  //Lista de usuarios y sus salas unidas (clave: idUser, valor: Set de room names)
  private userRooms: Map<number, Set<string>> = new Map();
  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) { }

  //============================================================
  //CONEXIÓN DE USUARIO (autenticación de la sesión WebSocket)
  //============================================================
  async handleConnection(client: Socket) {
    try {
      //Obtener el token
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No se ha enviado el token');
      //Decodificar JWT
      const payload = this.jwtService.verify(token);
      client.data.idUser = payload.sub;
      //Obtener el nombre de usuario desde ChatService
      try {
        const user = await this.chatService.getUserById(client.data.idUser);
        client.data.username = user?.username || `user-${client.data.idUser}`;
      } catch (err) {
        //si falla, poner un fallback
        client.data.username = `user-${client.data.idUser}`;
      }
      //Agregar a la lista de usuarios conectados
      this.onlineUsers.set(client.data.idUser, client.data.username);
      //Inicializar conjunto de salas para este usuario
      this.userRooms.set(client.data.idUser, new Set());

      console.log(`✅ Cliente conectado: ${client.id} (${client.data.username})`);
      //Notificar a todos los clientes
      this.broadcastOnlineUsers();
      //Unir automáticamente a los canales del usuario
      await this.joinUserChannels(client);
    } catch (error) {
      console.log(`❌ Error de autenticación: ${error.message}`);
      client.disconnect();
    }
  }

  //============================================================
  // Desconexión
  //============================================================
  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente desconectado: ${client.id} (${client.data?.username})`);
    if (client.data && client.data.idUser) {
      this.onlineUsers.delete(client.data.idUser);
      this.broadcastOnlineUsers();
    }
  }

  //===========================================================
  //unirse automaticamente a los canales del usuario en el que
  //Ya eres miembro
  //===========================================================
  private async joinUserChannels(client: Socket){
    try{
      const userId = client.data.idUser;
      const userChannels = await this.channelsService.getUserChannels(userId);
      for(const channel of userChannels){
        const room = `Grupo:${channel.idChannel}`;
        client.join(room)
        this.addUserToRoom(userId, room);
      }
    } catch (error) {
      console.error('Error uniendo usuario a sus canales:', error.message);
    }
  }

  //============================================================
  // Agregar usuario a la lista de salas
  //============================================================
  private addUserToRoom(userId: number, room: string){
    if(!this.userRooms.has(userId)){
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)?.add(room);
  }

  //============================================================
  // Remover usuario de la lista de salas
  //============================================================
  private removeUserFromRoom(userId: number, room: string) {
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)?.delete(room);
    }
  }

  //============================================================
  // Enviar la lista actualizada de usuarios en línea
  //============================================================
  private broadcastOnlineUsers() {
    const usersArray = Array.from(this.onlineUsers.entries()).map(([id, username]) => ({
      idUser: id,
      username,
    }));
    this.server.emit('onlineUsers', usersArray);
  }

  //============================================================
  // Unirse y salir de canales
  //============================================================
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    try {
      const channel = await this.channelsService.getChannelById(idChannel);
      //Verificar que el usuario es miembro del canal
      const isMember = channel.members.some(member => member.idUser === client.data.idUser);
      if (!isMember && channel.type !== 'dm') {
        client.emit('error', { message: 'No eres miembro de este canal' });
        return;
      }
      const room = `Canal:${idChannel}`;
      client.join(room);
      this.addUserToRoom(client.data.idUser, room);
      //Enviar historial al usuario recién conectado
      const history = await this.chatService.getMessages(idChannel);
      client.emit('history', history);
      //Notificar a otros usuarios en la sala que alguien se unió
      client.to(room).emit('userJoinedRoom', {
        userId: client.data.idUser,
        username: client.data.username,
        channelId: idChannel
      });
    } catch (error) {
      console.error('Error uniéndose al canal:', error.message);
      client.emit('error', { message: 'Error al unirse al canal' });
    }
  }
  
  //======================================================================================
  // Evento para manejar la salida del canal
  //======================================================================================
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    const room = `Canal:${idChannel}`;
    client.leave(room);
    this.removeUserFromRoom(client.data.idUser, room);

    console.log(`🚪 Usuario ${client.data.username} salió del canal ${idChannel}`);

    client.to(room).emit('userLeftRoom', {
      userId: client.data.idUser,
      username: client.data.username,
      channelId: idChannel,
    });
  }
  private broadcastPublicChannelsUpdate() {
    this.server.emit('publicChannelsUpdate');
  }
  //======================================================================================
  // Helper: obtener socket por userId
  //======================================================================================
  private findSocketByUserId(userId: number): Socket | null {
    const sockets = Array.from(this.server.sockets.sockets.values());
    return sockets.find(socket => socket.data.idUser === userId) || null;
  }
  //========== ==================================================
  //Salir de canal
  //============================================================
  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(@MessageBody() channelId: number, @ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.idUser;  
      //Usar el servicio para salir del canal
      const result = await this.channelsService.leaveChannel(channelId, userId);
      const room = `Canal:${channelId}`;
      client.leave(room);
      this.removeUserFromRoom(userId, room);
      console.log(`🚪 Usuario ${client.data.username} salió del canal ${channelId}`);
      //Notificar a otros usuarios en el canal
      client.to(room).emit('userLeftChannel', {
        userId: userId,
        username: client.data.username,
        channelId: channelId
      });
      client.emit('channelLeft', { channelId, message: result.message });
    } catch (error) {
      console.error('Error saliendo del canal:', error.message);
      client.emit('error', { message: error.message });
    }
  }

  //============================================================
  //ENVIAR MENSAJE (incluye notificación global)
  //============================================================
  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: CreateChatDto, @ConnectedSocket() client: Socket) {
    const idUser = client.data.idUser;
    //Crear mensaje en DB (retorna message con relation user)
    const message = await this.chatService.createMessage(
      idUser,
      payload.idChannel,
      payload.text,
    );
    //Si la creación falló, notificar al cliente y salir
    if (!message) {
      client.emit('error', { message: 'Error al crear el mensaje' });
      return;
    }
    const room = `Canal:${payload.idChannel}`;
    //Construir un objeto con la misma forma que el front espera (user, idMessage, etc.)
    const outgoing = {
      idMessage: (message as any).idMessage ?? null,
      channel: { idChannel: payload.idChannel },
      text: message.text,
      createdAt: message.createdAt,
      user: {
        idUser: message.user?.idUser,
        username: message.user?.username,
      },
    };
    //Enviar al remitente (su propia burbuja)
    client.emit('newMessage', outgoing);
    //Enviar a los demás usuarios del canal (no al remitente)
    client.to(room).emit('newMessage', { ...outgoing, self: false });
    //Enviar a TODOS los usuarios del canal (excepto remitente)
    //Esto incluye a usuarios que no están actualmente en el chat
    // Notificación global
    client.to(room).emit('newMessageNotification', {
      idChannel: payload.idChannel,
      sender: message.user?.username,
      text: message.text,
      timestamp: new Date().toISOString(),
    });
    //Emitir a todos los sockets en la sala excepto al remitente
    console.log(`💬 Mensaje enviado por ${message.user?.username} en canal ${payload.idChannel}`);
  }
  
  //============================================================
  // Unirse a un canal público
  //============================================================
  @SubscribeMessage('joinPublicChannel')
  async handleJoinPublicChannel(@MessageBody() channelId: number, @ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.idUser;
      //Utilizar el servicio para unirse a un canal
      const channel = await this.channelsService.joinPublicChannel(channelId, userId);
      const room = `Canal:${channelId}`;
      client.join(room);
      this.addUserToRoom(userId, room);
      console.log(`✅ Usuario ${client.data.username} se unió al canal público ${channel.name}`);
      //Notificar a todos los usuarios del canal que alguien nuevo se unió
      this.server.to(room).emit('userJoinedChannel', {
        userId: userId,
        username: client.data.username,
        channelId: channelId,
        channelName: channel.name
      });
      //Enviar confirmacion al usuario
      client.emit('channelJoined', channel);
      //Enviar historial de mensajes
      const history = await this.chatService.getMessages(channelId);
      client.emit('history', history);

    } catch (error) {
      console.error('Error uniéndose al canal público:', error.message);
      client.emit('error', { message: error.message });
    }
  }

  //============================================================
  // Editar mensaje
  //============================================================
  @SubscribeMessage('editMessage')
  async handleEditMessage(@MessageBody() payload: UpdateChatDto, @ConnectedSocket() client: Socket) {
    try {
      const message = await this.messageService.findOne(Number(payload.idMessage));
      if (!message) {
        client.emit('error', { message: 'Mensaje no encontrado' });
        return;
      }
      if (message.user.idUser !== client.data.idUser) {
        client.emit('error', { message: 'No puedes editar mensajes de otros usuarios' });
       return;
      }
      const updated = await this.messageService.updateMessage(
        Number(payload.idMessage),
        payload.newText,
      );
      const room = `Canal:${message.channel.idChannel}`;
      this.server.to(room).emit('messageEdited', updated);
      console.log(`✏️ Mensaje editado (ID: ${payload.idMessage})`);
    } catch (err) {
      console.error('Error editando mensaje:', err.message);
      client.emit('error', { message: 'Error al editar el mensaje' });
    }
  }

  //============================================================
  // Eliminar mensaje
  //============================================================
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(@MessageBody() idMessage: string, @ConnectedSocket() client: Socket) {
    try {
      const message = await this.messageService.findOne(Number(idMessage));
      if (!message) {
        client.emit('error', { message: 'Mensaje no encontrado' });
        return;
      }
      if (message.user.idUser !== client.data.idUser) {
        client.emit('error', { message: 'No puedes eliminar mensajes de otros usuarios' });
        return;
      }
      await this.messageService.removeMessage(Number(idMessage));
      const room = `Canal:${message.channel.idChannel}`;
      //Enviar solo el ID del mensaje como string
      this.server.to(room).emit('messageDeleted', idMessage);
      console.log(`🗑️ Mensaje eliminado (ID: ${idMessage})`);
    } catch (err) {
      console.error('Error eliminando mensaje:', err.message);
      client.emit('error', { message: 'Error al eliminar el mensaje' });
    }
  }

  //============================================================
  //Obtener canales públicos
  //============================================================
  @SubscribeMessage('getPublicChannels')
  async handleGetPublicChannels(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.idUser;
      const publicChannels = await this.channelsService.getPublicChannelsWithMembership(userId);
      client.emit('publicChannels', publicChannels);
    } catch (error) {
      console.error('Error obteniendo canales públicos:', error.message);
      client.emit('error', { message: 'Error al cargar canales públicos' });
    }
  }

  //============================================================
  //Crear un canal DM
  //============================================================
  @SubscribeMessage('createChannelDM')
  async handleDMCreateChannel(
  @MessageBody() payload: { userId: number; targetUsername: string },
  @ConnectedSocket() client: Socket,) {
    try {
      const result = await this.chatService.getOrCreatePrivateChannel(
        payload.userId,
        payload.targetUsername,
      );
      const channel = result.channel;
      //Enviar al creador del DM
      client.emit('channelCreated', channel);
      //Notificar al otro usuario si está conectado
      const otherMember = channel.members?.find(
        (member) => member.idUser !== payload.userId,
      );
      if (otherMember) {
        //Para el otro usuario, el nombre debe ser el username del creador
        const creatorMember = channel.members?.find(
          (member) => member.idUser === payload.userId,
        );
        const channelForOtherUser = {
          ...channel,
          //El otro usuario debe ver el username del creador
          name: creatorMember ? creatorMember.username : client.data.username,
          displayName: creatorMember ? creatorMember.username : client.data.username,
          isDM: true
        };
        this.server.emit('newDMChannel', {
          channel: channelForOtherUser,
          forUserId: otherMember.idUser,
        });
        console.log(`💬 Nuevo DM creado: ${client.data.username} <-> ${otherMember.username}`);
      }
      return channel;
    } catch (error) {
      console.error('Error creando canal DM:', error.message);
      client.emit('error', { message: error.message || 'Error al crear el chat' });
    }
  }

  //============================================================
  //Obtener canales del usuario
  //============================================================
  @SubscribeMessage('getUserChannels')
  async handleGetUserChannels(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    const channels = await this.chatService.getUserChannels(userId);
    client.emit('userChannels', channels);
  }
  //============================================================
  // Eliminar canal
  //============================================================
  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel( @MessageBody() payload: { channelId: number}, @ConnectedSocket() client: Socket){
    try{
      const result = await this.channelsService.removeChannel(
        payload.channelId,
        client.data.idUser
      );
      //Notificar a todos los miembros del canal que fue eliminado
      this.server.emit('channelDeleted',{
          channelId: payload.channelId,
          deletedBy: client.data.idUser
        });
        console.log(`🗑️ Canal ${payload.channelId} eliminado por ${client.data.username}`);
        return result;
    } catch (error) {
      console.error('Error eliminando canal:', error.message);
      client.emit('error', { message: error.message || 'Error al eliminar el canal' });
    }
  }

  //============================================================
  //NOTIFICACIÓN DE USUARIO CONECTADO (para el frontend)
  //============================================================
  @SubscribeMessage('userConnected')
  async handleUserConnected(@MessageBody() username: string, @ConnectedSocket() client: Socket) {
    console.log(`🔔 Usuario ${username} notificado como conectado`);
    // El usuario ya fue agregado en handleConnection, solo log para debugging
  }

  //============================================================
  // Crear Canal publico 
  //============================================================
  @SubscribeMessage('createChannel')
  async handleCreatePublicChannel(
    @MessageBody() payload: { name: string; description?: string; isPublic: boolean, autoAddAllUsers:boolean },
    @ConnectedSocket() client: Socket, ){
    try{
      //Obtener el ID del creador
      const creatorId = client.data.idUser;
      if (!creatorId) {
        client.emit('error', { message: 'Usuario no autenticado' });
        return;
      }
      const channel = await this.channelsService.createChannel(
        payload.name,
        creatorId,
        payload.description ?? '',
        payload.isPublic,
        'channel'
      );
      //Unir al creador al canal automáticamente
      const room = `Canal:${channel.idChannel}`;
      client.join(room);
      this.addUserToRoom(creatorId, room);
      console.log(`✅ Canal creado: ${channel.name} por ${client.data.username}`);
      //Notificar a todos los usuarios sobre el nuevo canal (solo si es público)
      if (channel.isPublic) {
        this.server.emit('channelCreated', channel);
      } else {
        //Para canales privados, solo notificar al creador
        client.emit('channelCreated', channel);
      }
      return channel;
    } catch (err) {
      console.error('Error creando canal:', err.message);
      client.emit('error', { message: err.message });
    }
  }
}