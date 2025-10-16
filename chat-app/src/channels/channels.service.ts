import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';
@Injectable()
export class ChannelsService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelrepository: Repository<Channel>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    //Crear un canal publico
    async createChannel(name: string, description?: string){
        const channel = this.channelrepository.create({ name, description, isPublic:true });
        return this.channelrepository.save(channel);
    }

    //Listar todos los canales publicos
    async getAllPublicChannels(){
        return this.channelrepository.find({
            where: {isPublic:true},
            order: {createdAt: "DESC"},
        });
    }
    //Obtener un canal por ID
    async getChannelById(idChannel: number){
        const channel = await this.channelrepository.findOne({where: {idChannel} });
        if (!channel) throw new NotFoundException('Canal no ha sido encontrado');
        return channel;
    }
    
    //Eliminar un canal
    async removeChannel(idChannel: number){
        const channel = await this.getChannelById(idChannel);
        await this.channelrepository.remove(channel);
        return { message: `Canal ${idChannel} eliminado correctamente` };
    }

}
