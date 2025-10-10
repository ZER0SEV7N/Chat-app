import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Corregir la ruta a '../database/...'
import { Message } from '../entities/message.entity';
import { MessageService } from './message.service';

@Module({
    imports: [
        // Importa la entidad para que TypeORM sepa que la va a usar
        TypeOrmModule.forFeature([Message]),
    ],
    providers: [MessageService],
    exports: [MessageService], // Exporta el servicio para que otros módulos (como Chat) puedan usarlo
})
export class MessageModule { }