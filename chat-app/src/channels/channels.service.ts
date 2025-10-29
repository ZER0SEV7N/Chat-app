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
    
    // Eliminar un canal (y sus mensajes)
  // ============================================================
  async removeChannel(idChannel: number) {
    const channel = await this.channelrepository.findOne({
      where: { idChannel },
      relations: ['messages'], // incluimos mensajes para borrarlos en cascada
    });
    // Verificar si el canal existe
    if (!channel) {
        console.log(`❌ Canal ${idChannel} no encontrado`);
        throw new NotFoundException(`Canal con ID ${idChannel} no encontrado`);
    }
    //Evitar eliminar canales públicos
    if (channel.isPublic) {
        throw new Error('No se pueden eliminar canales públicos');
    }
    await this.channelrepository.remove(channel);
    console.log(`El Canal ${idChannel} se ha eliminado correctamente`);
    return { message: `Canal ${idChannel} eliminado correctamente` };
  }
}
