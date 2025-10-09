import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity'; // Asegúrate de que esta ruta sea correcta

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    // ¡CAMBIO CRÍTICO! De string a number
    @Column({ name: 'senderId', type: 'int' }) // Usar 'int' o 'integer' para el tipo de DB
    senderId: number; // <--- ¡DEBE SER NUMBER AQUÍ!

    @ManyToOne(() => User)
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
