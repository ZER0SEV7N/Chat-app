//src/auth/auth.controller.ts
//Controlador responsable de manejar la autenticación del usuario.
//Incluye los endpoints para el registro y el inicio de sesión.
//Utiliza JSON Web Tokens (JWT) para la autenticación.
import { Controller, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
//Importar RegisterDTO
import { RegisterDTO } from './usersDto/register.dto';
//Importar LoginDTO
import { LoginDTO } from './usersDto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*============================================================
   *POST /auth/register
   *Endpoint para registrar un nuevo usuario.
   *Utiliza ValidationPipe para validar automáticamente los campos
   *según las reglas definidas en RegisterDTO.
  ============================================================*/
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true })) //Activa la validación automática
  async register(@Body() registerDto: RegisterDTO) {
    const { name, username, email, phone, password } = registerDto; //Parametros que se solicitan
    console.log("Body recibido en NestJS:", registerDto);
    return this.authService.register(name, username, email, phone, password); 
  }

   /*============================================================
   *POST /auth/login
   *Endpoint para iniciar sesión.
   *Valida credenciales mediante LoginDTO y delega la lógica en
   *AuthService.login.
  ============================================================*/
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true })) //Activa la validación automática
  async login(@Body() loginDto: LoginDTO) {
    const { username, password } = loginDto; //Parametros que se solicitan
    console.log("Body recibido en NestJS:", loginDto);
    return this.authService.login(username, password); 
  }
}
