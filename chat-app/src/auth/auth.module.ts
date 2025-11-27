//src/auth/auth.module.ts
//Modulo de auth, configura y provee todos los servicios relacionados con autentificacion
//Importaciones utilizadas:
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
//Compontentes del modulo
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), //Provee acceso a la entidad user para operaciones en la BD
    PassportModule, //para estrategias de autenticación con JWT
      JwtModule.register({ //Configuracion del modulo JWT
        global: true, //Disponible en todos los modulos
        secret: 'MI_SECRETO_SUPER_SEGURO', //clave fija (Puede ser cambiada)
        signOptions: { expiresIn: '24h'} //Los tokens expiran después de 24 horas
      }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService, JwtGuard],
    exports: [AuthService, JwtModule] //por si lo necesitas en otros módulos
  })
export class AuthModule {}

