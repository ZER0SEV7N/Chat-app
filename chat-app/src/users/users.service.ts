//users/users.service.ts
//Servicio para la gestion de usuarios
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
//Servicio UsersService
@Injectable()
//Servicio para la gestion de usuarios
export class UsersService {
    //Inyeccion del repositorio de User
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    //Metodo para crear un nuevo usuario
    async createUser(name: string, username: string, email: string, phone: string, password: string) {
        //Hashear la contraseña antes de guardarla
        const hashed = await bcrypt.hash(password, 10);
        //Crear la entidad User
        const user = this.userRepository.create({
            name,
            username,
            email,
            phone,
            password: hashed,
        });
        return this.userRepository.save(user);
    }
    //Metodo para buscar un usuario por su nombre de usuario
    async findByUsername(username: string) {
        //Incluir la contraseña en la consulta
        return this.userRepository
            .createQueryBuilder('user') 
            .addSelect('user.password') //necesario
            .where('user.username = :username', { username })
            .getOne();
    }

    //Metodo para guardar cambios en un usuario
    async saveUser(user: User) {
        return this.userRepository.save(user); 
    }
    //Metodo para obtener los canales de un usuario
    async getUserChannels(idUser: number) {
        const user = await this.userRepository.findOne({
            where: { idUser },
            relations: ['channels'],
        });
        if (!user) throw new Error('Usuario no encontrado');
        return user.channels;
    }
    async findAll(): Promise<Partial<User>[]> {
        return this.userRepository.find({
            select: ['idUser', 'username', 'name', 'email'],
        });
    }
}
