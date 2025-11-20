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
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageService } from '../messages/message.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) {}

  // ============================================================
  // CONEXIÓN Y AUTENTICACIÓN
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
  // UNIR / SALIR DE CANALES
  // ============================================================
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    client.join(`Canal:${idChannel}`);
    console.log(`👤 Usuario ${client.data.idUser} se unió al canal ${idChannel}`);

    const history = await this.chatService.getMessages(idChannel);
    client.emit('history', history);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    client.leave(`Canal:${idChannel}`);
    console.log(`👋 Usuario ${client.data.idUser} salió del canal ${idChannel}`);
  }

  // ============================================================
  // ENVIAR MENSAJE
  // ============================================================
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: { idChannel: number; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const idUser = client.data.idUser;

    // Guardar mensaje en DB
    const message = await this.chatService.createMessage(idUser, payload.idChannel, payload.text);

    // ✅ Comprobamos que el mensaje realmente se haya creado
    if (!message) {
      console.error('❌ Error: No se pudo crear el mensaje.');
      return;
    }

    console.log(`📨 Mensaje guardado en DB con ID: ${message.idMessage}`);

    // ✅ Emitir mensaje a todos los clientes en el canal con usuario incluido
    this.server.to(`Canal:${payload.idChannel}`).emit('newMessage', {
      channelId: payload.idChannel,
      senderId: idUser,
      senderName: message.user?.username || 'Desconocido', // <-- debería venir correctamente ahora
      content: message.text,
      createdAt: message.createdAt,
    });
  }

  // ============================================================
  // CREAR CANAL PRIVADO (DM)
  // ============================================================
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

  // ============================================================
  // OBTENER CANALES DEL USUARIO
  // ============================================================
  @SubscribeMessage('getUserChannels')
  async handleGetUserChannels(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    const channels = await this.chatService.getUserChannels(userId);
    client.emit('userChannels', channels);
  }

  // ============================================================
  // ELIMINAR CANAL
  // ============================================================
  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    await this.chatService.removeChannel(idChannel);
    client.emit('channelDeleted', idChannel);
  }
}
