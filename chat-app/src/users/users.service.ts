//users/users.service.ts
//Servicio encargado de gestionar la lógica relacionada con los usuarios.
//Incluye creación, búsqueda, actualización y recuperación de canales asociados.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    //Inyeccion del repositorio de User
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    /*===========================================================================
        Crear un nuevo usuario
    ===========================================================================*/
    async createUser(name: string, username: string, email: string, phone: string, password: string) {
        //Hashear la contraseña antes de guardarla
        const hashed = await bcrypt.hash(password, 10);
        //Crear la entidad User
        const user = this.userRepository.create({
            name,
            username,
            email,
            phone,
            password: hashed
        });
        return this.userRepository.save(user);
    }

    /*===========================================================================
        Buscar un usuario por su nombre de usuario
    ===========================================================================*/
    async findByUsername(username: string) {
        //Incluir la contraseña en la consulta
        return this.userRepository
            .createQueryBuilder('user') 
            .addSelect('user.password') //necesario
            .where('user.username = :username', { username })
            .getOne();
    }

    /*===========================================================================
        Guardar cambios de un usuario existente
    ===========================================================================*/
    async saveUser(user: User) {
        return this.userRepository.save(user); 
    }
    /*===========================================================================
        Obtener los canales asociados a un usuario
    ===========================================================================*/
    async getUserChannels(idUser: number) {
        const user = await this.userRepository.findOne({
            where: { idUser },
            relations: ['channels'],
        });
        if (!user) throw new Error('Usuario no encontrado');
        return user.channels;
    }
    /*===========================================================================
        Obtener la lista completa de usuarios (sin datos sensibles)
    ===========================================================================*/
    async findAll(): Promise<Partial<User>[]> {
        return this.userRepository.find({
            select: ['idUser', 'username', 'name', 'email'],
        });
    }
}
