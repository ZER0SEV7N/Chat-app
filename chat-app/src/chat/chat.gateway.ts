// src/chat/chat.gateway.ts
//============================================================
// Importaciones
//============================================================
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateChatDto } from '../auth/chatDto/create-chat.dto';
import { UpdateChatDto } from '../auth/chatDto/update-chat.dto';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from '../messages/message.service';
import { ChannelsService } from '../channels/channels.service';

//============================================================
// Gateway del chat
//============================================================
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 🧍‍♂️ Lista de usuarios conectados (clave: idUser, valor: username)
  private onlineUsers: Map<number, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) { }

  //============================================================
  // Conexión inicial
  //============================================================
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No se ha enviado el token');

      const payload = this.jwtService.verify(token);
      client.data.idUser = payload.sub;

      // 🔹 Obtener el nombre de usuario desde ChatService (asegúrate que exista getUserById)
      try {
        const user = await this.chatService.getUserById(client.data.idUser);
        client.data.username = user?.username || `user-${client.data.idUser}`;
      } catch (err) {
        // si falla, poner un fallback
        client.data.username = `user-${client.data.idUser}`;
      }

      // 🔹 Agregar a la lista de usuarios conectados
      this.onlineUsers.set(client.data.idUser, client.data.username);

      console.log(`✅ Cliente conectado: ${client.id} (${client.data.username})`);

      // 🔹 Notificar a todos los clientes
      this.broadcastOnlineUsers();
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

  //============================================================
  // 🔄 Enviar la lista actualizada de usuarios en línea
  //============================================================
  private broadcastOnlineUsers() {
    const usersArray = Array.from(this.onlineUsers.entries()).map(([id, username]) => ({
      idUser: id,
      username,
    }));
    this.server.emit('onlineUsers', usersArray);
  }

  // ============================================================
  // 👥 Unirse y salir de canales
  // ============================================================
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    const room = `Canal:${idChannel}`;
    client.join(room);
    console.log(`👥 Usuario ${client.data.username} se unió a ${room}`);

    const history = await this.chatService.getMessages(idChannel);
    client.emit('history', history);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    client.leave(`Canal:${idChannel}`);
    console.log(`🚪 Usuario ${client.data.username} salió del canal ${idChannel}`);
  }

  // ============================================================
  // 💬 Enviar mensaje
  // ============================================================
  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: CreateChatDto, @ConnectedSocket() client: Socket) {
    const idUser = client.data.idUser;

    // Crear mensaje en DB (retorna message con relation user)
    const message = await this.chatService.createMessage(
      idUser,
      payload.idChannel,
      payload.text,
    );

    // Si la creación falló, notificar al cliente y salir
    if (!message) {
      client.emit('error', { message: 'Error al crear el mensaje' });
      return;
    }

    const room = `Canal:${payload.idChannel}`;

    // Construir un objeto con la misma forma que el front espera (user, idMessage, etc.)
    const outgoing = {
      idMessage: (message as any).idMessage ?? null,
      channel: { idChannel: payload.idChannel },
      text: message.text,
      createdAt: message.createdAt,
      user: {
        idUser: message.user?.idUser,
        username: message.user?.username,
      },
      // marca para distinguir remitente en el frontend si se quiere
      self: true,
    };

    // 🔹 Enviar al remitente (su propia burbuja)
    client.emit('newMessage', outgoing);

    // 🔹 Enviar a los demás usuarios del canal (no al remitente)
    client.to(room).emit('newMessage', { ...outgoing, self: false });

    // 🔹 Notificar SOLO a los otros usuarios (no al remitente)
    client.to(room).emit('newMessageNotification', {
      idChannel: payload.idChannel,
      sender: message.user?.username,
    });

    console.log(`💬 Mensaje enviado por ${message.user?.username} en canal ${payload.idChannel}`);
  }

  // ============================================================
  // ✏️ Editar mensaje
  // ============================================================
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

  // ============================================================
  // 🗑️ Eliminar mensaje
  // ============================================================
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
      this.server.to(room).emit('messageDeleted', {
        idMessage: Number(idMessage),
        deletedBy: client.data.idUser,
      });
      console.log(`🗑️ Mensaje eliminado (ID: ${idMessage})`);
    } catch (err) {
      console.error('Error eliminando mensaje:', err.message);
      client.emit('error', { message: 'Error al eliminar el mensaje' });
    }
  }

  // ============================================================
  // ⚙️ CANALES (crear / eliminar / listar)
  // ============================================================
  @SubscribeMessage('createChannel')
  async handleCreateChannel(
    @MessageBody() payload: { userId: number; targetUsername: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const channel = await this.chatService.getOrCreatePrivateChannel(
        payload.userId,
        payload.targetUsername,
      );

      const channelWithMembers = await this.channelsService.getChannelById(
        channel.channel.idChannel,
      );
      client.emit('channelCreated', channel);

      const otherMember = channelWithMembers.members.find(
        (member) => member.idUser !== payload.userId,
      );
      if (otherMember) {
        this.server.emit('newChannelAvailable', {
          channel: channel.channel,
          forUserId: otherMember.idUser,
        });
      }

      console.log(`💬 Nuevo DM creado entre ${payload.userId} y ${otherMember?.idUser}`);
      return channel;
    } catch (error) {
      console.error('Error creando canal:', error.message);
      client.emit('error', { message: error.message || 'Error al crear el chat' });
    }
  }

  // ============================================================
  // Obtener canales del usuario
  // ============================================================
  @SubscribeMessage('getUserChannels')
  async handleGetUserChannels(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    const channels = await this.chatService.getUserChannels(userId);
    client.emit('userChannels', channels);
  }
}