//src/messages/message.controller.ts
//Controlador encargado de manejar los endpoints del API REST relacionados con mensajes.
//Importaciones necesarias
import {Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MessageService } from './message.service'
import { JwtGuard } from 'src/auth/jwt.guard'
@Controller('channels/:channelId/messages')
@UseGuards(JwtGuard)
export class MessageController{
    constructor(private readonly messageService: MessageService){}
    /*=======================================================================
        Obtener mensajes de un canal con paginación opcional.
    =========================================================================*/
    @Get()
    async getMessages(
        @Param('channelId') channelId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 50
    ) {
        if (channelId) {
            return this.messageService.findAll(channelId, page, limit);
        }
        return { message: 'Especifica un channelId' };
    }

    /*=======================================================================
        Obtener un mensaje específico por ID.
    =========================================================================*/
    @Get(':id')
    async getMessage(
        @Param('channelId') channelId: number,
        @Param('id') id:number ) {
        const message = await this.messageService.findOneInChannel(id, channelId);
        if (!message) {
        throw new NotFoundException('Mensaje no encontrado en este canal');
        }
        return message;
    }

    /*=======================================================================
        Crear un nuevo mensaje usando método REST.
        Requiere autenticación JWT.
    =========================================================================*/
    @UseGuards(JwtGuard)
    @Post()
    async createMessage(
        @Param('channelId') channelId: number,
        @Body() body: { text: string},
        @Req() req
    ){
        const userId = req.user.idUser;
        return this.messageService.create(body.text, userId, channelId);
    }

    /*=======================================================================
        Actualizar un mensaje existente.
        Solo el usuario propietario del mensaje puede editarlo.
    =========================================================================*/
    @UseGuards(JwtGuard)
    @Put(':id')
    async updateMessage(
        @Param('channelId') channelId: number, 
        @Param('id') id: number,
        @Body() body: {text: string},
        @Req() req
    ){  
        //Verificar que el texto se haya colocado
        if (!body.text || !body.text.trim()) {
            throw new BadRequestException('El texto del mensaje es requerido');
        }
        const userId = req.user.idUser;
        return this.messageService.updateMessageInChannel(id, channelId, body.text, userId);
    }

    /*=======================================================================
        Eliminar un mensaje.
        Únicamente el autor del mensaje puede eliminarlo.
    =========================================================================*/
    @UseGuards(JwtGuard)
    @Delete(':id')
    async deleteMessage(
        @Param('channelId') channelId: number,
        @Param('id') id: number, 
        @Req() req){
        const userId = req.user.idUser;
        return this.messageService.removeMessageFromChannel(id, channelId, userId);
    }
}