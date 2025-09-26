import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres', // nombre del servicio en docker-compose
      port: 5432,
      username: 'chatuser',
      password: 'chatpassword',
      database: 'chatdb',
      autoLoadEntities: true,
      synchronize: true, // solo en desarrollo
    }),
  ],
})
export class DatabaseModule {}
