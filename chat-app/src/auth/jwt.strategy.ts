import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'tu-clave-secreta',
    });
  }

  async validate(payload: any) {
    console.log('🔐 JWT Strategy - Payload recibido:', payload);
    
    return {
      idUser: payload.sub || payload.idUser || payload.id, // Probar diferentes opciones
      username: payload.username,
      phone: payload.phone,
      email: payload.email,
    };
  }
}