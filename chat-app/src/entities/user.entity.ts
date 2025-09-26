//Entidad Usuario
//Importaciones necesarias:
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";

//Definicion de la entidad User
@Entity()
export class User {
    @PrimaryGeneratedColumn() //Columna de ID autogenerada
    idUser: number;

    @Column() //Columna de nombre
    name: string;

    @Column({ unique: true }) //Columna de nombre de usuario
    username: string;

    @Column() //Columna de correo electronico
    email: string;

    @Column() //Columna de contraseña
    password: string;

    @CreateDateColumn()
    createdAt: Date;
}