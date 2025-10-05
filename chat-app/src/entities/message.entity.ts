//Entidad mensajes
//Importaciones necesarias:
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany, JoinTable, ManyToOne} from "typeorm";
import { User } from "./user.entity";
import { Channel } from "./channels.entity";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn() //Columna de ID autogenerada
    idMessage: number;

    @Column() //Columna de texto del mensaje
    text: string;

    //Relaciones
    @ManyToOne(() => User, user => user.messages)
    user: User;

    @ManyToOne(() => Channel, channel => channel.messages)
    channel: Channel;

    @CreateDateColumn() //Columna de fecha de creacion
    createdAt: Date;
}