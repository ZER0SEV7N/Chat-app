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
    PassportModule,
    JwtModule.register({
      global: true,
      secret: 'MI_SECRETO_SUPER_SEGURO', // 🔒 clave fija (idealmente usar .env)
      signOptions: {
        expiresIn: '7d', // ⏰ el token dura 7 días
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}