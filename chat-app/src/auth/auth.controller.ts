import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 👉 Endpoint para registro
  @Post('register')
  async register(@Body() body: any) {
    console.log("📥 Body recibido en NestJS:", body);
    return this.authService.register(body.name, body.username, body.email, body.password);
  }

  // 👉 Endpoint para login
  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(username, password);
  }
}
