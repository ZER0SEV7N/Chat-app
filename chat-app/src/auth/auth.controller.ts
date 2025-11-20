import { Controller, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
//Importar RegisterDTO
import { RegisterDTO } from './usersDto/register.dto';
//Importar LoginDTO
import { LoginDTO } from './usersDto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 👉 Endpoint para registro
// 👉 Endpoint para registro
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true })) // <-- Activa la validación automática
  async register(@Body() registerDto: RegisterDTO) {
    const { name, username, email, phone, password } = registerDto;
    console.log("📥 Body recibido en NestJS:", registerDto); // ✅ Aquí sí imprime correctamente
    return this.authService.register(name, username, email, phone, password);
  }

  // 👉 Endpoint para login
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDTO) {
    const { username, password } = loginDto;
    return this.authService.login(username, password);
  }
}
