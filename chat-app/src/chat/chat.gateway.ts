// src/chat/chat.gateway.ts
// ============================================================
// Importar los directorios
// ============================================================
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from '../auth/chatDto/create-chat.dto';
import { UpdateChatDto } from '../auth/chatDto/update-chat.dto';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from '../messages/message.service';
import { ChannelsService } from '../channels/channels.service';

// ============================================================
// Gateway del chat
// ============================================================
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) {}

  // ============================================================
  // 🔹 Conexión inicial
  // ============================================================
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No se ha enviado el token');
      const payload = this.jwtService.verify(token);
      client.data.idUser = payload.sub;
      console.log(`✅ Cliente conectado: ${client.id}, Usuario ID: ${client.data.idUser}`);
    } catch (error) {
      console.log(`❌ Error de autenticación: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente desconectado: ${client.id}`);
  }

  // ============================================================
  // 👥 Unirse y salir de canales
  // ============================================================
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() idChannel: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `Canal:${idChannel}`;
    client.join(room);
    console.log(`👥 Usuario ${client.data.idUser} se unió a ${room}`);

    const history = await this.chatService.getMessages(idChannel);
    client.emit('history', history);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() idChannel: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`Canal:${idChannel}`);
    console.log(`🚪 Usuario ${client.data.idUser} salió del canal ${idChannel}`);
  }

  // ============================================================
  // 💬 Enviar mensaje
  // ============================================================
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const idUser = client.data.idUser;
    const message = await this.chatService.createMessage(idUser, payload.idChannel, payload.text);

    const room = `Canal:${payload.idChannel}`;
    this.server.to(room).emit('newMessage', message);
  }

  // ============================================================
  // ✏️ Editar mensaje
  // ============================================================
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @MessageBody() payload: UpdateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messageService.findOne(Number(payload.idMessage));
      if (!message) {
        client.emit('error', { message: 'Mensaje no encontrado' });
        return;
      }

      // Solo el autor puede editar su mensaje
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
  async handleDeleteMessage(
    @MessageBody() idMessage: string,
    @ConnectedSocket() client: Socket,
  ) {
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
      this.server.to(room).emit('messageDeleted', Number(idMessage));

      console.log(`🗑️ Mensaje eliminado (ID: ${idMessage})`);
    } catch (err) {
      console.error('Error eliminando mensaje:', err.message);
      client.emit('error', { message: 'Error al eliminar el mensaje' });
    }
  }

  // ============================================================
  // ⚙️ CANALES (crear / eliminar / listar)
  // ============================================================

  // Crear canal (por ejemplo, DM)
  @SubscribeMessage('createChannel')
  async handleCreateChannel(
    @MessageBody() payload: { userId: number; targetUsername: string },
    @ConnectedSocket() client: Socket,
  ) {
    const channel = await this.chatService.getOrCreatePrivateChannel(
      payload.userId,
      payload.targetUsername,
    );
    client.emit('channelCreated', channel);
  }

  // Obtener canales del usuario
  @SubscribeMessage('getUserChannels')
  async handleGetUserChannels(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const channels = await this.chatService.getUserChannels(userId);
    client.emit('userChannels', channels);
  }

  // ============================================================
  // 🗑️ Eliminar canal (solo creador o admin)
  // ============================================================
  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(
    @MessageBody() idChannel: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // 🔹 Obtener el usuario que intenta eliminar el canal
      const idUser = client.data.idUser;

      // 🔹 Llamar al service con ambos IDs
      const deleted = await this.channelsService.removeChannel(idChannel, idUser);

      // 🔹 Emitir eventos al cliente y a la sala
      client.emit('channelDeleted', deleted);
      const room = `Canal:${idChannel}`;
      this.server.to(room).emit('channelRemoved', { idChannel });

      console.log(`🗑️ Canal eliminado (${idChannel}) por usuario ${idUser}`);
      return deleted;
    } catch (err) {
      console.error('Error eliminando canal:', err.message);
      client.emit('error', { message: err.message || 'No se pudo eliminar el canal' });
    }
  }
}
