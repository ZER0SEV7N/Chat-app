import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  // Cuando un cliente envía un mensaje con el evento "message"
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): void {
    console.log('Mensaje recibido:', message);
    // retransmitir el mensaje a todos los clientes conectados
    this.server.emit('message', message);
  }
}
