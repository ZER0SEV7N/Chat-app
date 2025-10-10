//Entidad mensajes
//Importaciones necesarias:
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity"; // Asegúrate de que esta ruta sea correcta
import { Channel } from "./channels.entity"; // Necesitas esta entidad para la relación

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn() // Usamos el ID numérico del compañero
    idMessage: number;

    @Column('text') // Usamos el tipo 'text' de tu versión, pero el nombre 'text' del compañero
    text: string;

    @CreateDateColumn() // Columna de fecha de creación
    createdAt: Date;

    // =========================================================================
    // RELACIONES (USAMOS LAS RELACIONES DEL COMPAÑERO, SON MÁS COMPLETAS)
    // =========================================================================

    // Relación con el Usuario (el que envía el mensaje)
    @ManyToOne(() => User, user => user.messages)
    user: User;

    // Relación con el Canal (el mensaje pertenece a un canal)
    @ManyToOne(() => Channel, (channel) => channel.messages, { onDelete: 'CASCADE' })
    channel: Channel;
}