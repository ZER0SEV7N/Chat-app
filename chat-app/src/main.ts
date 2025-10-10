import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io'; // Importación necesaria

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CONFIGURACIÓN DE CORS PARA API REST (NECESARIA para la API)
  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. CONFIGURACIÓN WEBSOCKETS (SIMPLIFICADA)
  // Pasamos 'app' como argumento al IoAdapter. Esto le permite usar el servidor HTTP existente.
  // Las opciones de CORS para WebSockets se manejan MEJOR en @WebSocketGateway.
  app.useWebSocketAdapter(new IoAdapter(app)); // <- Así de simple debe ser

  await app.listen(3000);
}
bootstrap();
