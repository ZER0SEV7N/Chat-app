import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 👈 importa ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { ChannelsController } from './channels/channels.controller';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [
    // 👇 Carga variables de entorno desde .env
    ConfigModule.forRoot({
      isGlobal: true, // disponible en toda la app sin volver a importarlo
    }),

    UsersModule,
    DatabaseModule,
    ChatModule,
    AuthModule,
    ChannelsModule,
  ],
  controllers: [AppController, ChannelsController],
  providers: [AppService],
})
export class AppModule {}
