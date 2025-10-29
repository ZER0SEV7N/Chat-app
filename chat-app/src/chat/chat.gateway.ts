//Importar los directorios
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

@WebSocketGateway({ cors: { origin: '*' } }) // habilitamos CORS
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 🧠 Mapa para guardar usuarios conectados (userId -> socketId)
  private onlineUsers = new Map<number, string>();

  //Constructor
  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) {}

  // ==============================
  // 🔹 CONEXIÓN / DESCONEXIÓN
  // ==============================
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No se ha enviado el token');

      const payload = this.jwtService.verify(token);
      client.data.idUser = payload.sub;

      // 🟢 Guardamos al usuario como conectado
      this.onlineUsers.set(payload.sub, client.id);

      console.log(`✅ Cliente conectado: Usuario ID ${client.data.idUser}`);

      // 🔄 Notificar a todos que este usuario está en línea
      this.server.emit('userStatus', { userId: payload.sub, status: 'online' });
    } catch (error) {
      console.log(`❌ Error de autenticación: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.idUser;
    if (userId) {
      // 🔴 Eliminamos del mapa
      this.onlineUsers.delete(userId);
      console.log(`🔌 Cliente desconectado: Usuario ID ${userId}`);

      // 🔄 Notificar a todos que el usuario está offline
      this.server.emit('userStatus', { userId, status: 'offline' });
    }
  }

  // ==============================
  // 📡 ESTADO DE USUARIOS
  // ==============================
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const users = Array.from(this.onlineUsers.keys());
    client.emit('onlineUsers', users);
  }

  // ==============================
  // 📩 MENSAJES
  // ==============================

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const idUser = client.data.idUser;
    const message = await this.chatService.createMessage(
      idUser,
      payload.idChannel,
      payload.text,
    );
    const room = `Canal:${payload.idChannel}`;
    this.server.to(room).emit('newMessage', message);
  }

  // ==============================
  // ✏️ EDITAR MENSAJE
  // ==============================
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

  // ==============================
  // 🗑️ ELIMINAR MENSAJE
  // ==============================
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

  // ==============================
  // ⚙️ CANALES
  // ==============================
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

  @SubscribeMessage('getUserChannels')
  async handleGetUserChannels(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const channels = await this.chatService.getUserChannels(userId);
    client.emit('userChannels', channels);
  }

  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(
    @MessageBody() idChannel: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const deleted = await this.channelsService.removeChannel(idChannel);
      client.emit('channelDeleted', deleted);

      const room = `Canal:${idChannel}`;
      this.server.to(room).emit('channelRemoved', { idChannel });
      console.log(`🗑️ Canal privado eliminado (${idChannel})`);
      return deleted;
    } catch (err) {
      console.error('Error eliminando canal:', err.message);
      client.emit('error', { message: 'No se pudo eliminar el canal' });
    }
  }
}
