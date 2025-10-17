import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as os from 'os'; //para obtener la IP local

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1️⃣ Configuración de CORS para REST
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2️⃣ Adaptador WebSocket
  app.useWebSocketAdapter(new IoAdapter(app));

  // 3️⃣ Servidor escuchando en todas las interfaces de red
  const PORT = 3000;
  await app.listen(PORT, '0.0.0.0');

  // 4️⃣ Obtener IP local (LAN)
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

  // 5️⃣ Mostrar IPs disponibles
  console.log(`🚀 Servidor NestJS corriendo en:`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Red LAN: http://${localIp}:${PORT}`);
}
bootstrap();