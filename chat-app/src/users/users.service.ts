import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    
    async createUser(username: string, password: string){
        const hashed = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({username, password: hashed});
        return this.userRepository.save(user);
    }

    async findByUsername(username: string){
        return this.userRepository.findOne({where: {username}});
    }

}
