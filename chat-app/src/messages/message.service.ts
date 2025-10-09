import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// ¡Ruta corregida! Usando '../entities/message.entity' como indicaste.
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
    ) { }

    // 1. Guardar un nuevo mensaje en la base de datos
    // *** ¡CORRECCIÓN! Orden de argumentos ajustado a (content, senderId) y senderId es 'number' ***
    async create(content: string, senderId: number): Promise<Message> { // <-- AJUSTADO
        const newMessage = this.messageRepository.create({
            senderId,
            content,
            // Aquí podrías agregar el channelId cuando ese módulo exista
        });

        return this.messageRepository.save(newMessage);
    }

    // 2. Cargar el historial de mensajes al iniciar el chat (para el futuro)
    async findAll(): Promise<Message[]> {
        return this.messageRepository.find({
            order: { createdAt: 'ASC' }, // Los mensajes más antiguos primero
            relations: ['sender'], // Para cargar la información del usuario que lo envió
        });
    }
}