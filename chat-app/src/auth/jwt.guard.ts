<<<<<<< HEAD
// ============================================================
// 📁 JwtGuard - Middleware de autenticación por JWT
// ------------------------------------------------------------
// Este guard se encarga de verificar que la solicitud HTTP
// contenga un token JWT válido en el encabezado Authorization.
// ============================================================

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
=======
//src/auth/jwt.guard.ts
//Guard para proteger rutas con JWT
//Importaciones necesarias:
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
import { JwtService } from '@nestjs/jwt';
//Definicion del JwtGuard
@Injectable()
export class JwtGuard implements CanActivate {
  //Inyectar JwtService
  constructor(private readonly jwtService: JwtService) {}
  //Metodo para proteger rutas con JWT
  canActivate(context: ExecutionContext): boolean {
<<<<<<< HEAD
    // Obtener el objeto de la request
    const request = context.switchToHttp().getRequest();

    // Leer el encabezado Authorization
    const authHeader = request.headers['authorization'];

=======
    const request = context.switchToHttp().getRequest(); //Obtener la solicitud HTTP
    const authHeader = request.headers.authorization; //Obtener el header de autorizacion
    //Verificar si el header existe
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado'); //Si no existe, lanzar error
    }
<<<<<<< HEAD

    // Extraer el token del formato "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }

    try {
      // Verificar y decodificar el token JWT
      const payload = this.jwtService.verify(token, {
          secret: 'MI_SECRETO_SUPER_SEGURO',
      });

      // Adjuntar la información del usuario al request
      request.user = payload;

      // ✅ Permitir que la petición continúe
      return true;
=======
    //Verificar si el token es valido
    const token = authHeader.split(' ')[1];
    try {
      //Verificar el token
      const payload = this.jwtService.verify(token);
      request.user = payload; //Añadimos el usuario al request
      return true; //Token valido, permitir acceso
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
    } catch (err) {
      // Si el token expira o es incorrecto, lanza excepción
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}