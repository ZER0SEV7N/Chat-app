//src/auth/auth.service.ts
//Servicio para la autenticacion
//Importaciones necesarias:
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  //Registrar usuario
    async register(name: string, username: string, email: string, phone: string, password: string) {
      const existingUser = await this.usersService.findByUsername(username);
      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
      return this.usersService.createUser(name, username, email, phone, password);
    }

  //Login
  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    //generar token JWT
    const payload = { sub: user.idUser, username: user.username };
    const token = await this.jwtService.signAsync(payload);
    return {
      access_token: token,
      user: {
        id: user.idUser,
        username: user.username,
        email: user.email,
        phone: user.phone
      },
    };
  }
}

