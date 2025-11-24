// src/channels/channels.controller.ts
//Importaciones necesarias
import { 
  Controller, Get, 
  Post, Delete, 
  Param, Body, 
  Patch, Req,
  UnauthorizedException, UseGuards} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/jwt.guard';

@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService, // ✅ Inyectar JwtService
  ) {}

  /*============================================================
  Obtener todos los canales públicos CON INFORMACIÓN DE MEMBRESÍA
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get('public')
  async getPublicChannels(@Req() req) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    
    return this.channelsService.getPublicChannelsWithMembership(userId);
  }
  /*============================================================
  Unirse a un canal público
  ============================================================*/
  @UseGuards(JwtGuard)
  @Post(':id/join')
  async joinChannel(@Param('id') id: number, @Req() req) {
    const userID = req.user?.idUser;
    if (!userID) throw new UnauthorizedException('Usuario no autenticado');
    
    return this.channelsService.joinPublicChannel(id, userID);
  }

  /*============================================================
  Obtener canales del usuario actual (para sidebar)
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get('user/channels')
  async getUserChannels(@Req() req) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    return this.channelsService.getUserChannels(userId);
  }

  /*============================================================
  Crear un canal
  ============================================================*/
  @UseGuards(JwtGuard)
  @Post()
  async createChannel(
      @Req() req,
      @Body() body: { name: string; description?: string;  isPublic?: boolean; type?: string },
  ) {
      const userId = req.user?.idUser;
      if (!userId) throw new UnauthorizedException('Usuario no autenticado');
      console.log('🎯 Solicitud de creación de canal:', {
          name: body.name,
          isPublic: body.isPublic,
          requestedType: body.type,
          userId,
      });

      const result = await this.channelsService.createChannel(
          body.name,
          userId,  
          body.description,
          body.isPublic ?? true,
          'channel',
      );

      console.log('✅ Respuesta del servicio:', {
          id: result.idChannel,
          name: result.name,
          type: result.type,
          isPublic: result.isPublic
      });

      return result;
  }

  /*============================================================
  Obtener un canal por su ID
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get(':id')
  async getChannelById(@Param('id') id: number) {
    return this.channelsService.getChannelById(id);
  }

  /*============================================================
  Eliminar un canal por su ID
  ============================================================*/
  @UseGuards(JwtGuard)
  @Delete(':id')
  async deleteChannel(
    @Param('id') id: number, 
    @Req() req: Request,
  ) {
    //Obtener el usuario del token JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Falta el token de autorización');
    }
    
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    const userId = payload.sub; // ID del usuario autenticado

    if (!userId) {
      throw new UnauthorizedException('Token inválido');
    }

    return this.channelsService.removeChannel(id, userId);
  }
  
  /*============================================================
  Actualizar un canal
  ============================================================*/
  @UseGuards(JwtGuard)
  @Patch(':id')
  async updateChannel(
    @Param('id') idChannel: number,
    @Body() body: { name?: string; description?: string; isPublic?: boolean },
    @Req() req: Request, //
  ) {
    //Obtener el usuario del token JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Falta el token de autorización');
    }
    
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException('Token inválido');
    }

    return this.channelsService.updateChannel(idChannel, body, userId);
  }

  /*============================================================
  Obtener los usuarios de un canal
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get(':id/manage-users')
  async getUsersForChannelManagement(@Param('id')id: number, @Req() req: Request,){
    // Obtener usuario del token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new UnauthorizedException('Falta el token de autorización');
    }
    
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;

    return this.channelsService.getUsersForChannel(id, userId);
  }

  /*=============================================================
  Agregar un usuario a un canal
  ==============================================================*/
  @UseGuards(JwtGuard)
  @Post(':id/add-user')
  async addUserToChannel(
    @Param('id') id: number,
    @Body() body: { username: string },
    @Req() req
  ) {
    return this.channelsService.addUserToChannel(id, body.username);
  }

  /*=============================================================
  Expulsar (eliminar) un usuario del canal
  ==============================================================*/
  @UseGuards(JwtGuard)
  @Delete(':id/remove-user/:userId')
  async removeUserFromChannel(
    @Param('id') id: number,
    @Param('userId') userId: number,
  ) {
    return this.channelsService.removeUserFromChannel(id, userId);
  }

  /*=============================================================
  Salir de un canal
  ==============================================================*/
  @UseGuards(JwtGuard)
  @Post(':id/leave')
  async leaveChannel(@Param('id') id: number, @Req() req) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    return this.channelsService.leaveChannel(id, userId);
  }
}