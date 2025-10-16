import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule, //para estrategias de autenticación
      JwtModule.register({
        secret: 'MI_SECRETO_SUPER_SEGURO', // 👈 clave fija
        signOptions: { expiresIn: '1h' },  // tiempo de expiración
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService],
    exports: [AuthService, JwtModule] //por si lo necesitas en otros módulos
  })
export class AuthModule {}

