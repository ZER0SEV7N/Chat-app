import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // 🔹 Crear o recuperar canal privado (por username)
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

    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);

    const userId = payload.sub; // el id del usuario autenticado
    return this.chatService.getOrCreatePrivateChannel(userId, body.targetUsername);
  }
}
