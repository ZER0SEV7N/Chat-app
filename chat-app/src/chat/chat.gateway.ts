import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageService } from '../messages/message.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapa para relacionar cada idUser con su socketId actual
  private connectedUsers: Map<number, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) { }

  // ==============================
  // CONEXIÓN / DESCONEXIÓN
  // ==============================

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No se ha enviado el token');

      const payload = this.jwtService.verify(token);
      client.data.idUser = payload.sub;

      this.connectedUsers.set(client.data.idUser, client.id); // Guardamos su socket
      console.log(`✅ Cliente conectado: ${client.id}, Usuario ID: ${client.data.idUser}`);
    } catch (error) {
      console.log(`❌ Error de autenticación: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente desconectado: ${client.id}`);
    const userId = client.data.idUser;
    if (userId) this.connectedUsers.delete(userId);
  }

  // ==============================
  // CANALES / SALAS
  // ==============================

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() idChannel: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`Canal:${idChannel}`);
    console.log(`👥 Usuario ${client.data.idUser} se unió al canal ${idChannel}`);

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

  // ==============================
  // MENSAJES
  // ==============================

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: { idChannel: number; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const idUser = client.data.idUser;

    // Guardar mensaje en DB
    const message = await this.chatService.createMessage(
      idUser,
      payload.idChannel,
      payload.text,
    );

    console.log(`💬 Mensaje guardado (ID: ${message.idMessage})`);

    // Emitir a todos los usuarios conectados en la sala (los que están en el chat)
    this.server.to(`Canal:${payload.idChannel}`).emit('newMessage', message);

    // Obtener los miembros del canal para enviar notificación directa
    const channelUsers = await this.chatService.getUsersInChannel(payload.idChannel);

    // Notificar al otro usuario (aunque no esté en la sala activa)
    for (const user of channelUsers) {
      if (user.idUser !== idUser) {
        const targetSocketId = this.connectedUsers.get(user.idUser);
        if (targetSocketId) {
          this.server.to(targetSocketId).emit('notification', {
            fromUserId: idUser,
            idChannel: payload.idChannel,
            text: payload.text,
          });
          console.log(`📢 Notificación enviada a usuario ${user.idUser}`);
        }
      }
    }
  }

  // ==============================
  // GESTIÓN DE CANALES
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
    await this.chatService.removeChannel(idChannel);
    client.emit('channelDeleted', idChannel);
  }
}
