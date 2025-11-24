//Entidad canales
//Importaciones necesarias:
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany, JoinTable, JoinColumn, ManyToOne} from "typeorm";
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

    @Column({type: "varchar", default: "channel", length: 10}) 
    type: "channel" | "dm";

    @CreateDateColumn() //Columna de fecha de creacion
    createdAt: Date;
    
    //Relaciones
    @OneToMany(() => Message, message => message.channel)
    messages: Message[];

    //Relación muchos a muchos con usuarios (miembros del canal)
    @ManyToMany(() => User, (user) => user.channels, { cascade: true })
    @JoinTable({
      name: "users_channels_channels",
      joinColumn: { name: "channelsIdChannel", referencedColumnName: "idChannel" },
      inverseJoinColumn: { name: "usersIdUser", referencedColumnName: "idUser" },
    })
    members: User[];

    @ManyToOne(() => User, (user) => user.createdChannels)
    @JoinColumn({ name: "creatorId" })
    creator: User;

}
