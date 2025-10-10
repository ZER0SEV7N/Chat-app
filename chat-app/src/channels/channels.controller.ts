import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ChannelsService } from './channels.service';
@Controller('channels')
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService) {}

    @Get()
    async getAllPublicChannels(){
        return this.channelsService.getAllPublicChannels();
    }

    @Post()
    async createChannel(@Body() Body: {name: string, description?: string}){
        return this.channelsService.createChannel(Body.name, Body.description);
    }

    @Get(':id')
    async getChannelById(@Param('id') id: number) {
    return this.channelsService.getChannelById(id);
  }

  @Delete(':id')
  async deleteChannel(@Param('id') id: number) {
    return this.channelsService.removeChannel(id);
  }
}
