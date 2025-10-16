import { WebSocketGateway, SubscribeMessage, MessageBody,
  WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt'; // <-- Traído del código del compañero
import { MessageService } from '../messages/message.service'; // <-- Traído de tu código

// Importa la entidad User para obtener el ID, si ya la tienes en tu proyecto.
// import { User } from '../database/entities/user.entity'; 
@WebSocketGateway({ cors: { origin: '*' } }) //habilitamos CORS
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect { //Usamos la interfaz de conexión del compañero
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService, // <-- Inyectado del compañero
    private readonly messageService : MessageService, // <-- Inyectado de tu código
  ) { }


  // =================================================================================
  // MANEJO DE CONEXIÓN Y DESCONEXIÓN (DEL CÓDIGO DEL COMPAÑERO)
  // =================================================================================

  //Cuando se establece la conexion
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error("No se ha enviado el token");

      const payload = this.jwtService.verify(token);
      client.data.idUser = payload.sub; // Almacenar el idUser en los datos del socket

        console.log(`Cliente conectado: ${client.id}, Usuario ID: ${client.data.idUser}`);
      } catch (error) {
        console.log(`Error de autenticación: ${error.message}`);
        client.disconnect(); //Desconectar el cliente si la autenticación falla
      }
  }
  //Cuando se desconecta el cliente
  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }


  // =================================================================================
  // UNIRSE A SALAS Y OBTENER HISTORIAL (DEL CÓDIGO DEL COMPAÑERO)
  // =================================================================================

  // Unirse a una sala
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
    client.join(`Canal: ${idChannel}`);
    console.log(`Usuario ${client.data.idUser} se unió al canal -${idChannel}`);

    //Devolver el historial de mensajes al unirse a la sala
    const history = await this.chatService.getMessages(idChannel);
    client.emit('history', history);
  }

  //Salir de un canal
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() channelId: number, @ConnectedSocket() client: Socket) {
    client.leave(String(channelId));
    console.log(`Usuario con ID ${client.data.idUser} salió del canal ${channelId}`);
  }
  // =================================================================================
  // ENVIAR Y PERSISTIR MENSAJE (CÓDIGO FUSIONADO)
  // =================================================================================

  //Enviar Mensaje
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: { idChannel: number, text: string },
    @ConnectedSocket() client: Socket) {

    // Usamos el ID de usuario que el compañero almacenó en el socket (tras el JWT)
    const idUser = client.data.idUser;

    // 1. GUARDA el mensaje en la base de datos (Usamos la lógica del compañero)
    const message = await this.chatService.createMessage(idUser, payload.idChannel, payload.text);

    console.log(`[PERSISTENCIA OK] Mensaje guardado en DB con ID: ${message.idMessage}.`); // Mensaje de confirmación

    // 2. Emitir el mensaje a todos los usuarios en la sala
    this.server.to(`Canal: ${payload.idChannel}`).emit('newMessage', message);
  }
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
    await this.chatService.removeChannel(idChannel); // (debes implementarlo)
    client.emit('channelDeleted', idChannel);
  }
}