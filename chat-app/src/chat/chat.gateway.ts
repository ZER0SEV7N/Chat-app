import { WebSocketGateway, SubscribeMessage, MessageBody,
  WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from '../auth/chatDto/create-chat.dto'; // <--Importa el DTO de creación de chat
import { UpdateChatDto } from '../auth/chatDto/update-chat.dto'; // <--Importa el DTO de actualización de chat
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt'; // <--Importa el servicio JWT
import { MessageService } from '../messages/message.service'; // <--Importa el servicio de mensajes
import { ChannelsService } from '../channels/channels.service'; // <--Importa el servicio de canales

// Importa la entidad User para obtener el ID, si ya la tienes en tu proyecto.
// import { User } from '../database/entities/user.entity'; 
@WebSocketGateway({ cors: { origin: '*' } }) //habilitamos CORS
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect { //Usamos la interfaz de conexión del compañero
  // Servidor WebSocket
  @WebSocketServer()
  server: Server;
  //Inyectar los servicios necesarios
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService, // <--Inyectado del compañero
    private readonly messageService : MessageService, // <--Inyectado de tu código
    private readonly channelsService: ChannelsService, //inyectado correctamente
  ) { }
  //MANEJO DE CONEXIÓN Y DESCONEXIÓN (DEL CÓDIGO DEL COMPAÑERO)

  //Cuando un cliente se establece la conexion
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token; //Obtener el token del handshake
      if (!token) throw new Error("No se ha enviado el token"); //Verificar que el token existe
      //Verificar y decodificar el token JWT
      const payload = this.jwtService.verify(token); //Usar el servicio JWT
      client.data.idUser = payload.sub; // Almacenar el idUser en los datos del socket
      //Mensaje de conexión exitosa
      console.log(`Cliente conectado: ${client.id}, Usuario ID: ${client.data.idUser}`);
      } catch (error) {
        //Si hay un error de autenticación, desconectar el cliente
        console.log(`Error de autenticación: ${error.message}`);
        client.disconnect(); //Desconectar el cliente si la autenticación falla
      }
  }
  //Cuando se desconecta el cliente
  handleDisconnect(client: Socket) {
    //Mostrar mensaje de desconexión
    console.log(`Cliente desconectado: ${client.id}`);
  }
  //UNIRSE A SALAS Y OBTENER HISTORIAL de MENSAJES
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

  //Enviar Mensaje
  @SubscribeMessage('sendMessage')
  async handleMessage(
    //El cuerpo del mensaje contiene el ID del canal y el texto
    @MessageBody() payload: { idChannel: number, text: string },
    @ConnectedSocket() client: Socket) {

    // Usamos el ID de usuario que el compañero almacenó en el socket (tras el JWT)
    const idUser = client.data.idUser;

    //GUARDA el mensaje en la base de datos (Usamos la lógica del compañero)
    const message = await this.chatService.createMessage(idUser, payload.idChannel, payload.text);
    //Emitir el mensaje a todos los usuarios en la sala
    this.server.to(`Canal: ${payload.idChannel}`).emit('newMessage', message);
  }
  //CREAR CANAL PRIVADO ENTRE DOS USUARIOS
  @SubscribeMessage('createChannel')
  async handleCreateChannel(
    @MessageBody() payload: { userId: number; targetUsername: string },
    @ConnectedSocket() client: Socket,
  ) {
    //Usar el servicio de chat para crear o recuperar el canal privado
    const channel = await this.chatService.getOrCreatePrivateChannel(
      payload.userId,
      payload.targetUsername,
    );
    //Emitir el canal creado de vuelta al cliente
    client.emit('channelCreated', channel);
  }
  //OBTENER CANALES DEL USUARIO
  @SubscribeMessage('getUserChannels')
  async handleGetUserChannels(
    //El cuerpo del mensaje contiene el idUser
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    //Usar el servicio de chat para obtener los canales del usuario
    const channels = await this.chatService.getUserChannels(userId);
    client.emit('userChannels', channels);
  }
  //ELIMINAR CANAL Y SUS MENSAJES (solo DMs)
  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(
    @MessageBody() idChannel: number,
    @ConnectedSocket() client: Socket,
  ) {
    //Usar el servicio de canales para eliminar el canal
    try{
      const deleted = await this.channelsService.removeChannel(idChannel);
      client.emit('channelDeleted', deleted);

      //Notificar a todos los miembros conectados de que se eliminó el canal
      const room = `Canal: ${idChannel}`;
      this.server.to(room).emit('channelRemoved', { idChannel });
      //Mostrar en consola
      console.log(`🗑️ Canal privado eliminado (${idChannel})`);
      //Devolver el resultado de la eliminación
      return deleted;
    } catch (err) {
      //Manejar errores (como intentar eliminar un canal público)
      console.error('Error eliminando canal:', err.message);
      client.emit('error', { message: 'No se pudo eliminar el canal' });
    }
  }
}