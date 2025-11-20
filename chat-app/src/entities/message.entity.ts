//Entidad mensajes
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { Channel } from "./channels.entity";

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  idMessage: number;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relación con el Usuario (el que envía el mensaje)
  @ManyToOne(() => User, user => user.messages, { eager: true }) // 👈 AGREGADO: eager: true
  user: User;

  // Relación con el Canal (el mensaje pertenece a un canal)
  @ManyToOne(() => Channel, (channel) => channel.messages, { onDelete: 'CASCADE' })
  channel: Channel;
}
