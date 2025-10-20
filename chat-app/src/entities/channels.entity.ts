//Entidad canales
//Importaciones necesarias:
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany} from "typeorm";
import { Message } from "./message.entity";
import { User } from "./user.entity";
//Definicion de la entidad Channel
@Entity('channels')
export class Channel {
    @PrimaryGeneratedColumn() //Columna de ID autogenerada
    idChannel: number;

    @Column() //Columna de nombre del canal
    name: string;

    @Column({ nullable: true }) //Columna de descripcion del canal
    description: string;

    @Column({ default: true }) //Columna para indicar si el canal es publico o privado
    isPublic: boolean;

    @CreateDateColumn() //Columna de fecha de creacion
    createdAt: Date;

    //Relaciones
    @OneToMany(() => Message, message => message.channel)
    messages: Message[];

    //Relacion con usuarios (muchos a muchos)
    @ManyToMany(() => User, (user) => user.channels)
    members: User[];
}
