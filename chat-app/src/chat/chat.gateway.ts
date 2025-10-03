import { WebSocketGateway, SubscribeMessage, MessageBody, 
  WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket  } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) // Permitir CORS desde cualquier origen
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService
  ) {}
  //Cuando se establece la conexion
    async handleConnection(client: Socket) {
      try {
        const token = client.handshake.auth.token;
        if(!token) throw new Error("No se ha enviado el token");

        const payload = this.jwtService.verify(token);
        client.data.idUser = payload.sub; // Almacenar el idUser en los datos del socket

        console.log(`Cliente conectado: ${client.id}, Usuario ID: ${client.data.idUser}`);
      } catch (error) {
        console.log(`Error de autenticación: ${error.message}`);
        client.disconnect(); // Desconectar el cliente si la autenticación falla
      }
  }
    //Cuando se desconecta el cliente
    handleDisconnect(client: Socket) {
      console.log(`Cliente desconectado: ${client.id}`);
  }

    // Unirse a una sala
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@MessageBody() idChannel: number, @ConnectedSocket() client: Socket) {
      client.join(`Canal: ${idChannel}`);
      console.log(`Usuario ${client.data.idUser} se unió al canal -${idChannel}`);

      //Devolver el historial de mensajes al unirse a la sala
      const history = await this.chatService.getMessages(idChannel);
      client.emit('history', history);
  }
    //Enviar Mensaje
    @SubscribeMessage('sendMessage')
    async handleMessage(
      @MessageBody() payload: { idChannel: number, text: string }, 
      @ConnectedSocket() client: Socket) {
      const idUser = client.data.user.sub; //Id de usuario desde el token

      //Guardar en la BD
      const message = await this.chatService.createMessage(idUser, payload.idChannel, payload.text);

      //Emitir el mensaje a todos los usuarios en la sala
      this.server.to(`Canal: ${payload.idChannel}`).emit('newMessage', message);
  }
}
