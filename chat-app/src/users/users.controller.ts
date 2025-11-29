//src/users/users.controller.ts
//Controlador para la gestión de usuarios
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard'; 

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /*=======================================================================
    GET /users/channels
    Obtener los canales del usuario autenticado
  ========================================================================*/
  @UseGuards(JwtGuard)
  @Get('channels')
  async getUserChannels(@Req() req) {
    const idUser = req.user.sub; // el ID del usuario autenticado
    return this.usersService.getUserChannels(idUser);
  }

  /*=======================================================================
    GET /users
    Obtener todos los usuarios
  ========================================================================*/
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}