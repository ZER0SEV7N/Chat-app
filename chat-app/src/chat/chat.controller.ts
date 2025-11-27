//chat-app/src/chat/chat.controller.ts
//Controlador encargado de manejar las rutas relacionadas al chat y canales
//============================================================

//Importaciones necesarias
import { Controller, Post, Body, Req, Delete, Param, Get, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/jwt.guard';
//Controlador para manejar las rutas del chat
@Controller('chat')
export class ChatController {
  chatGateway: any;
  constructor(
    private readonly chatService: ChatService, //Inyectar el servicio de chat
    private readonly jwtService: JwtService, //Inyectar el servicio JWT
  ) {}

  /*========================================================================
  Crear o recuperar un canal privado (DM)
  =========================================================================*/
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
  
  /*=======================================================================
  Obtener todos los usuarios
  =========================================================================*/
  @Get('users')
  async getAllUsers(@Req() req: Request) {
    // Extraer token JWT desde encabezado Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Falta el token de autorización');
    }
    
    //Extraer el token del encabezado
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    
    //Obtener el idUser del payload del token
    const currentUserId = payload.sub;
    
    return this.chatService.getAllUsers(currentUserId);
  }

  /*=======================================================================
  Obtener todos los canales del usuario (incluye: públicos, privados y DMs)
  =========================================================================*/
  @UseGuards(JwtGuard)
  @Get('user-channels')
  async getUserChannels(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Falta el token de autorización');
    }
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;
    return this.chatService.getUserChannels(userId);
  }

  /*======================================================================
  Obtener solo los DMs del usuario
  =========================================================================*/
  @Get('dms')
  async getUserDMs(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Falta el token de autorización');
    }
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;
    
    return this.chatService.getUserDMs(userId);
  }

 /*=====================================================================================
  Eliminar un DM (solo si el usuario pertenece al DM)
  =========================================================================*/
  @UseGuards(JwtGuard)
  @Delete('dm/:channelId')
  async deleteDM(
    @Param('channelId') channelId: number,
    @Req() req: Request
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Falta el token de autorización');
    }
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;  
    return this.chatService.deleteDM(channelId, userId);
  }
}
