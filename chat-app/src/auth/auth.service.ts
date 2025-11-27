//src/auth/auth.service.ts
//Servicio para la autenticacion, maneja la logica de negocio para registro/login y generacion de JWT
//Responsable de la seguridad, hash de contraseña y validar las credenciales
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

    /*============================================================
      Registrar un nuevo usuario
    ============================================================*/
    async register(name: string, username: string, email: string, phone: string, password: string) {
      const existingUser = await this.usersService.findByUsername(username); //Verifica si el nombre de usuario ya existe.
      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }//Si no existe, delega la creación al UsersService.
      return this.usersService.createUser(name, username, email, phone, password);
    }

  /*============================================================
    Iniciar sesión
  ============================================================*/
  async login(username: string, password: string) {
    //Ubicar el usuario por su usernam
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    //Validar la contraseña (comparacion con el hash)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    //Payload del token JWT (información mínima necesaria)
    const payload = { sub: user.idUser, username: user.username };
    const token = await this.jwtService.signAsync(payload); //Generar el token
    //Retornar respuesta estructurada
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

