//src/channels/channels.controller.ts
//Controlador de canales, maneja todos los endspoints para la gestion de canales
//Su principal funcionalidad es un CRUD de canales
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
import { JwtGuard } from 'src/auth/jwt.guard'; //Utilizar el guard

@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService, //Inyectar JwtService
  ) {}

  /*============================================================
   *GET /channels/public
   *Obtiene todos los canales públicos junto con la información
   *de si el usuario autenticado pertenece o no a cada canal.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get('public')
  async getPublicChannels(@Req() req) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    return this.channelsService.getPublicChannelsWithMembership(userId);
  }

  /*============================================================
   *POST /channels/:id/join
   *Permite al usuario autenticado unirse a un canal público.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Post(':id/join')
  async joinChannel(@Param('id') id: number, @Req() req) {
    const userID = req.user?.idUser;
    if (!userID) throw new UnauthorizedException('Usuario no autenticado');
    return this.channelsService.joinPublicChannel(id, userID);
  }

  /*============================================================
   *GET /channels/user/channels
   *Obtiene todos los canales del usuario autenticado.
   *Usado para la barra lateral del ChatList.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get('user/channels')
  async getUserChannels(@Req() req) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    return this.channelsService.getUserChannels(userId);
  }

  /*============================================================
   *POST /channels/create
   *Crea un nuevo canal asociado al usuario autenticado.
  ===========================================================*/
  @UseGuards(JwtGuard)
  @Post('create')
  async createChannel(@Req() req, @Body() body: { 
    name: string; description?: string;  isPublic?: boolean; type?: string },
  ) {
      const userId = req.user?.idUser; //Obtener el Id del usuario
      if (!userId) throw new UnauthorizedException('Usuario no autenticado');
      const result = await this.channelsService.createChannel(
          body.name,
          userId,  
          body.description,
          body.isPublic ?? true,
          'channel',
      ); //Crear un canal con los parametros que se envian  
      console.log('✅ Respuesta del servicio:', {
          id: result.idChannel,
          name: result.name,
          type: result.type,
          isPublic: result.isPublic
      });
      return result;
  }

  /*============================================================
   *GET /channels/:id
   *Obtiene la información de un canal a partir de su ID.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get(':id')
  async getChannelById(@Param('id') id: number) {
    return this.channelsService.getChannelById(id);
  }

  /*============================================================
   *DELETE /channels/:id
   *Elimina un canal. Solo el creador puede hacerlo.
   *Verifica manualmente el token en la cabecera Authorization.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Delete(':id')
  async deleteChannel(@Param('id') id: number, @Req() req: Request) {
    //Obtener el usuario del token JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Falta el token de autorización');
    }
    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify(token); //Verificar el token
    const userId = payload.sub; // ID del usuario autenticado

    if (!userId) {
      throw new UnauthorizedException('Token inválido');
    }

    return this.channelsService.removeChannel(id, userId);
  }
  
  /*============================================================
   *PATCH /channels/:id
   *Actualiza los datos de un canal (nombre, descripción, etc.).
   *Solo permitido para el propietario del canal.
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
   *GET /channels/:id/manage-users
   *Obtiene los usuarios de un canal para su administración.
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

  /*============================================================
   *POST /channels/:id/add-user
   *Agrega un usuario al canal mediante su nombre de usuario.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Post(':id/add-user')
  async addUserToChannel(
    @Param('id') id: number,
    @Body() body: { username: string },
    @Req() req
  ) {
    return this.channelsService.addUserToChannel(id, body.username);
  }

  /*============================================================
   *DELETE /channels/:id/remove-user/:userId
   *Expulsa a un usuario del canal.
   *Solo permitido para usuarios con rol adecuado.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Delete(':id/remove-user/:userId')
  async removeUserFromChannel(
    @Param('id') id: number,
    @Param('userId') userId: number,
  ) {
    return this.channelsService.removeUserFromChannel(id, userId);
  }

  /*============================================================
   *POST /channels/:id/leave
   *Permite al usuario autenticado salir del canal.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Post(':id/leave')
  async leaveChannel(@Param('id') id: number, @Req() req) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    return this.channelsService.leaveChannel(id, userId);
  }

  /*============================================================
   *GET /channels
   *Obtienes todos los canales sin importar si es publico o no.
  ============================================================*/
  @UseGuards(JwtGuard)
  @Get()
  async getAllChannels(@Req() req:any) {
    const userId = req.user?.idUser;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    return this.channelsService.getAllChannels(userId);
  }

}