//chat-app/src/chat/chat.controller.ts
//Controlador encargado de manejar las rutas relacionadas al chat y canales
//============================================================

//Importaciones necesarias
import { Controller, Post, Body, Req, Delete, Param, Get, UseGuards, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/jwt.guard';
//Controlador para manejar las rutas del chat
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  chatGateway: any;
  constructor(
    private readonly chatService: ChatService, //Inyectar el servicio de chat
    private readonly jwtService: JwtService, //Inyectar el servicio JWT
  ) {}

  /*========================================================================
    Extraer userId del token JWT de forma reusable
  =========================================================================*/
  private extractUserIdFromToken(req: Request): number {
    const authHeader = req.headers.authorization;
    if(!authHeader){
      throw new UnauthorizedException("Falta el token de autorizacion para poder realizar cambios");

    }
    const token = authHeader.split(' ')[1];
    if(!token){
      throw new UnauthorizedException("Token mal formado")
    }
     try {
      const payload = this.jwtService.verify(token);
      return payload.sub; //el id del usuario autenticado
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /*========================================================================
  Crear o recuperar un canal privado (DM)
  =========================================================================*/
  @Post('private')
  async getOrCreatePrivateChannel(
    @Body() body: { targetUsername: string },
    @Req() req: Request,
  ) {
    if (!body.targetUsername?.trim()) {
      throw new BadRequestException('targetUsername es requerido');
    }
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    return this.chatService.getOrCreatePrivateChannel(userId, body.targetUsername);
  }
  
  /*=======================================================================
  Obtener todos los usuarios
  =========================================================================*/
  @Get('users')
  async getAllUsers(@Req() req: Request) {
    //Obtener el idUser del payload del token
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    return this.chatService.getAllUsers(userId);
  }

  /*=======================================================================
  Obtener todos los canales del usuario (incluye: públicos, privados y DMs)
  =========================================================================*/
  @Get('user-channels')
  async getUserChannels(@Req() req: Request) {
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    return this.chatService.getUserChannels(userId);
  }

  /*======================================================================
  Obtener solo los DMs del usuario
  =========================================================================*/
  @Get('dms')
  async getUserDMs(@Req() req: Request) {
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    return this.chatService.getUserDMs(userId);
  }

 /*=====================================================================================
  Eliminar un DM (solo si el usuario pertenece al DM)
  =========================================================================*/
  @Delete('dm/:channelId')
  async deleteDM(
    @Param('channelId') channelId: number,
    @Req() req: Request
  ) {
    if (!channelId || isNaN(channelId)) {
      throw new BadRequestException('channelId debe ser un número válido');
    }
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    return this.chatService.deleteDM(channelId, userId);
  }

  /*======================================================================
  Obtener todos los canales DM del usuario (alternativa más específica)
  =========================================================================*/
  @Get('my-dms')
  async getAllMyDMs(@Req() req: Request) {
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    return this.chatService.getUserDMs(userId); // Reutiliza el mismo servicio
  }

  /*======================================================================
    Obtener un DM específico por ID
  =========================================================================*/
  @Get('dm/:channelId')
  async getDMBychannelId(
    @Param('channelId') channelId: number,
    @Req() req: Request
  ) {
    const userId = this.extractUserIdFromToken(req); // el id del usuario autenticado
    const dm = await this.chatService.getDMById(channelId, userId);
    if (!dm) {
      throw new NotFoundException('DM no encontrado o no tienes acceso');
    }
    return dm;
  }
}
