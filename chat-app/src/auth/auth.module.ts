import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule, //para estrategias de autenticación
      JwtModule.register({
        global: true,
        secret: 'MI_SECRETO_SUPER_SEGURO' //clave fija
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService],
    exports: [AuthService, JwtModule] //por si lo necesitas en otros módulos
  })
export class AuthModule {}

