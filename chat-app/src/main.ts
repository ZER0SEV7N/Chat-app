import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1️⃣ Configuración de CORS para REST y WebSocket
  app.enableCors({
    origin: '*', // puedes poner tu IP o dominio específico si lo deseas
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2️⃣ Adaptador WebSocket global (para que funcione con socket.io-client)
  app.useWebSocketAdapter(new IoAdapter(app));

  // 3️⃣ Pipes globales para validar DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 4️⃣ Puerto e IP
  const PORT = 3000;
  await app.listen(PORT, '0.0.0.0');

  // 5️⃣ Mostrar IP local (para conexión desde otra PC o móvil)
  const nets = os.networkInterfaces();
  const results: Record<string, string> = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        results[name] = net.address;
      }
    }
  }

  const localIp = Object.values(results)[0] || 'localhost';

  console.log('🚀 Servidor NestJS corriendo en:');
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Red LAN: http://${localIp}:${PORT}`);
}
bootstrap();