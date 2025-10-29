import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ChannelsService } from './channels.service';
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}
  //Endpoint para obtener todos los canales públicos
  @Get()
  async getAllPublicChannels(){
      return this.channelsService.getAllPublicChannels();
  }
  //Endpoint público (sin autenticación)
  @Get('public')
  async getPublicChannels() {
    return this.channelsService.getAllPublicChannels();
  }
  //Endpoint para crear un canal
  @Post()
  async createChannel(@Body() Body: {name: string, description?: string}){
      return this.channelsService.createChannel(Body.name, Body.description);
  }
  //Endpoint para obtener un canal por su ID
  @Get(':id')
  async getChannelById(@Param('id') id: number) {
  return this.channelsService.getChannelById(id);
  }
  //Endpoint para eliminar un canal por su ID
  @Delete(':id')
  async deleteChannel(@Param('id') id: number) {
    return this.channelsService.removeChannel(id);
  }
}
