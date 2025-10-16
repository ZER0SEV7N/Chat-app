import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard'; // 👈 el guard que creamos antes

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtGuard)
  @Get('channels')
  async getUserChannels(@Req() req) {
    const idUser = req.user.sub; // el ID del usuario autenticado
    return this.usersService.getUserChannels(idUser);
  }
}
