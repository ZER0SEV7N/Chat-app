//Entidad Usuario
//Importaciones necesarias:
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Message } from "./message.entity";
import { Channel } from "./channels.entity";


//Definicion de la entidad User
@Entity('users')
export class User {
    @PrimaryGeneratedColumn() //Columna de ID autogenerada
    idUser: number;

    @Column() //Columna de nombre
    name: string;

    @Column({ unique: true }) //Columna de nombre de usuario
    username: string;

    @Column() //Columna de correo electronico
    email: string;

    @Column({ select: false }) //Columna de contraseña
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    //Relaciones (Añadidas por el compañero)
    //Relacion con Mensaje
    @OneToMany(() => Message, message => message.user)
    messages: Message[];

    @ManyToMany(() => Channel, (channel) => channel.members)
    @JoinTable()
    channels: Channel[];
        
    //Canales creados por el usuario
    @OneToMany(() => Channel, (channel) => channel.creator)
    createdChannels: Channel[];

}