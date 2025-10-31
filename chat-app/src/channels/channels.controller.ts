//src/channels/channels.controller
//Importaciones necesarias
import { Controller, Get, Post, Delete, Param, Body, Patch, Req } from '@nestjs/common';
import { ChannelsService } from './channels.service';
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

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
    @Body() body: { idUser: number }, // Por ahora se pasa en el body
  ) {
    return this.channelsService.removeChannel(id, body.idUser);
  }
  
  /*============================================================
  Actualizar un canal
  ============================================================*/
  @Patch(':id')
  async updateChannel(
    @Param('id') idChannel: number,
    @Body() body: { name?: string; description?: string; isPublic?: boolean; idUser: number },
  ) {
    return this.channelsService.updateChannel(idChannel, body, body.idUser);
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
