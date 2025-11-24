//src/auth/jwt.guard.ts
// ============================================================
// 📁 JwtGuard - Middleware de autenticación por JWT
// ------------------------------------------------------------
// Este guard se encarga de verificar que la solicitud HTTP
// contenga un token JWT válido en el encabezado Authorization.
// ============================================================
//Importaciones necesarias:
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { JwtService } from '@nestjs/jwt';
//Definicion del JwtGuard
@Injectable()
export class JwtGuard implements CanActivate {
  //Inyectar JwtService
  constructor(private readonly jwtService: JwtService) {}
  //Metodo para proteger rutas con JWT
  canActivate(context: ExecutionContext): boolean {
    const type = context.getType();

    //Caso de peticion HTTP
    if(type === 'http'){
      const request = context.switchToHttp().getRequest(); //Obtener la solicitud HTTP
      const authHeader = request.headers.authorization; //Obtener el header de autorizacion
      //Verificar si el header existe
      if (!authHeader) {
        throw new UnauthorizedException('Token no proporcionado'); //Si no existe, lanzar error
      }
      //Verificar si el token es valido
      const token = authHeader.split(' ')[1];
      try {
        //Verificar el token
        const payload = this.jwtService.verify(token);
        // Mapear explícitamente los campos
        request.user = {
          idUser: payload.sub,      // ← esto es clave
          username: payload.username // opcional, según lo que tengas en el JWT
        };//Añadimos el usuario al request
        return true; //Token valido, permitir acceso
      } catch (err) {
        // Si el token expira o es incorrecto, lanza excepción
        throw new UnauthorizedException('Token inválido o expirado');
      }
    }
    //Caso Socket.IO
    if(type === 'ws'){
      const client = context.switchToWs().getClient();
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if(!token){
        throw new UnauthorizedException('Token no proporcionado por el webSocket'); //Si no existe, lanzar error
      }

      try{
        const payload = this.jwtService.verify(token);
        client.user = {
          idUser: payload.sub,
          username: payload.username
        };
        return true;
      }catch{
        //Si el token expira o es incorrecto, lanza excepción
        throw new UnauthorizedException('Token inválido o expirado');
      }
    }
    return false;
  }
}