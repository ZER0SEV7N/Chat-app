//src/auth/jwt.guard.ts
//Guard para proteger rutas con JWT
//Importaciones necesarias:
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
//Definicion del JwtGuard
@Injectable()
export class JwtGuard implements CanActivate {
  //Inyectar JwtService
  constructor(private readonly jwtService: JwtService) {}
  //Metodo para proteger rutas con JWT
  canActivate(context: ExecutionContext): boolean {
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
      request.user = payload; //Añadimos el usuario al request
      return true; //Token valido, permitir acceso
    } catch (err) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
