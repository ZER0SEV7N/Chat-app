//chat-app/src/chat/chat.controller.ts
import { Controller, Post, Body, Req, Delete, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
//Controlador para manejar las rutas del chat
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService, //Inyectar el servicio de chat
    private readonly jwtService: JwtService, //Inyectar el servicio JWT
  ) {}

  //Crear o recuperar canal privado (por username)
  @Post('private')
  async getOrCreatePrivateChannel(
    @Body() body: { targetUsername: string },
    @Req() req: Request,
  ) {
    // Extraer token JWT desde encabezado Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Falta el token de autorización');
    }
    //Extraer el token del encabezado
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    //Obtener el idUser del payload del token
    const userId = payload.sub; // el id del usuario autenticado
    return this.chatService.getOrCreatePrivateChannel(userId, body.targetUsername);
  }

  
}
