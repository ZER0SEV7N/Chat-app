import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../messages/message.service';
// Importa la entidad User para obtener el ID, si ya la tienes en tu proyecto.
// import { User } from '../database/entities/user.entity'; 

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001', // El origen de tu frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnModuleInit {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService, // <-- ¡Inyectado!
  ) { }

  @WebSocketServer()
  public server: Server;

  onModuleInit() {
    this.server.on('connection', (socket: Socket) => {
      console.log("El cliente se ha conectado: ", socket.id);

      socket.on('disconnect', () => {
        console.log("El cliente se ha desconectado: ", socket.id);
      });
    });
  }

  // =================================================================================
  // FUNCIÓN CLAVE: ESCUCHA, GUARDA Y RE-EMITE EL MENSAJE CON PERSISTENCIA
  // =================================================================================
  @SubscribeMessage('sendMessage')
  async handleNewMessage( // <--- ¡Debe ser ASÍNCRONA!
    @MessageBody() content: string, // El contenido del mensaje (string)
    @ConnectedSocket() client: Socket,
  ) {
    // 1. OBTENER SENDER ID (SOLUCIÓN TEMPORAL CORREGIDA)
    // **¡SEÑALADO COMO NÚMERO ENTERO (1) para cumplir con el tipo 'number' esperado!**
    const senderId = 1;

    // 2. GUARDA el mensaje en la base de datos
    try {
      // LLAMADA FINAL: content (string) va primero, luego senderId (number)
      const savedMessage = await this.messageService.create(content, senderId);

      console.log(`[PERSISTENCIA OK] Mensaje guardado en DB con ID: ${savedMessage.id}. Contenido: ${savedMessage.content}`);

      // 3. RE-EMISIÓN: Envía el OBJETO COMPLETO
      this.server.emit('newMessage', savedMessage);

    } catch (error) {
      console.error("ERROR al guardar o emitir mensaje:", error.message);
    }
  }

  // =================================================================================
  // EVENTOS DE LA BASE DE DATOS (CRUD)
  // =================================================================================

  @SubscribeMessage('createChat')
  create(@MessageBody() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto);
  }

  @SubscribeMessage('findAllChat')
  findAll() {
    return this.chatService.findAll();
  }

  @SubscribeMessage('findOneChat')
  findOne(@MessageBody() id: number) {
    return this.chatService.findOne(id);
  }

  @SubscribeMessage('updateChat')
  update(@MessageBody() updateChatDto: UpdateChatDto) {
    return this.chatService.update(updateChatDto.id, updateChatDto);
  }

  @SubscribeMessage('removeChat')
  remove(@MessageBody() id: number) {
    return this.chatService.remove(id);
  }
}