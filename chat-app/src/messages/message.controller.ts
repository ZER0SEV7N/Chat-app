//src/messages/message.controller.ts
//Endpoints para el manejo del ApiRest
import {Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { MessageService } from './message.service'
import { JwtGuard } from 'src/auth/jwt.guard'

@Controller('messages')
@UseGuards(JwtGuard)
    export class MessageController{
        constructor(private readonly messageService: MessageService){}

        //Obtener mensajes de un canal (con paginacion)
        @Get()
        async getMessages(
            @Query('channelId') channelId: number,
            @Query('page') page: number = 1,
            @Query('limit') limit: number = 50
        ) {
            if (channelId) {
            return this.messageService.findAll(channelId);
            }
            return { message: 'Especifica un channelId' };
        }

        //Obtener un mensaje en especifico
        @Get(':id')
        async getMessage(@Param('id') id:number){
            return this.messageService.findOne(id);
        }

        //Crear un mensaje (Via Rest)
        @Post()
        async createMessage(
            @Body() body: {channelId: number; text: string},
            @Req() req
        ){
            const userId = req.user.idUser;
            return this.messageService.create(body.text, userId, body.channelId);
        }

        //Editar Mensaje
        @Put(':id')
        async updateMessage(@Param('id') id: number,
            @Body() body: {text: string},
            @Req() req){
            const userId = req.user.idUser;
            const message = await this.messageService.findOne(id);

            //Verificar que el usuario es el propetario del mensaje
            if(message?.user.idUser !== userId){
                throw new Error('Solo puedes editar tus propios mensajes')
            }
            return this.messageService.updateMessage(id, body.text);
        }

        //Eliminar un mensaje
        @Delete(':id')
        async deleteMessage(@Param('id') id: number, @Req() req){
            const userId = req.user.idUser;
            const message = await this.messageService.findOne(id);
            //Verificar que el usuario es el propetario del mensaje
            if(message?.user.idUser !== userId){
                throw new Error('Solo puedes editar tus propios mensajes')
            }
            return this.messageService.removeMessage(id);
        }

    }