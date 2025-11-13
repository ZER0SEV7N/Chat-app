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
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener el objeto de la request
    const request = context.switchToHttp().getRequest();

    // Leer el encabezado Authorization
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }

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
    } catch (err) {
      // Si el token expira o es incorrecto, lanza excepción
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}