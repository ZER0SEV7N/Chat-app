//src/users/users.controller.ts
//Controlador para la gestion de usuarios
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard'; 

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  //Obtener los canales del usuario autenticado
  @UseGuards(JwtGuard)
  @Get('channels')
  async getUserChannels(@Req() req) {
    const idUser = req.user.sub; // el ID del usuario autenticado
    return this.usersService.getUserChannels(idUser);
  }

    //Todos los usuarios
  @UseGuards(JwtGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

}
