// src/channels/channels.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Body, 
  Patch, 
  Req,
  UnauthorizedException 
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService, // ✅ Inyectar JwtService
  ) {}

  /*============================================================
  Obtener todos los canales públicos
  ============================================================*/
  @Get()
  async getAllPublicChannels(){
      return this.channelsService.getAllPublicChannels();
  }

  /*============================================================
  Endpoint público (sin autenticación)
  ============================================================*/
  @Get('public')
  async getPublicChannels() {
    return this.channelsService.getAllPublicChannels();
  }

  /*============================================================
  Crear un canal
  ============================================================*/
  @Post()
  async createChannel(
    @Body() body: { name: string; description?: string; creatorId: number; isPublic?: boolean },
  ) {
    return this.channelsService.createChannel(
      body.name,
      body.creatorId,  
      body.description,
      body.isPublic ?? true,
    );
  }

  /*============================================================
  Obtener un canal por su ID
  ============================================================*/
  @Get(':id')
  async getChannelById(@Param('id') id: number) {
    return this.channelsService.getChannelById(id);
  }

  /*============================================================
  Eliminar un canal por su ID
  ============================================================*/
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
  @Get(':id/users')
  async getChannelUsers(@Param('id')id: number){
    return this.channelsService.getChannelUsers(id);
  }

  /*=============================================================
  Agregar un usuario a un canal
  ==============================================================*/
  @Post(':id/add-user')
  async addUserToChannel(
    @Param('id') id: number,
    @Body() body: { username: string },
  ) {
    return this.channelsService.addUserToChannel(id, body.username);
  }

  /*=============================================================
  Expulsar (eliminar) un usuario del canal
  ==============================================================*/
  @Delete(':id/remove-user/:userId')
  async removeUserFromChannel(
    @Param('id') id: number,
    @Param('userId') userId: number,
  ) {
    return this.channelsService.removeUserFromChannel(id, userId);
  }
}