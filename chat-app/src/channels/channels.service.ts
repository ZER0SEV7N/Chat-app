//src/channels/channels.service.ts
//Importaciones necesarias
import { Injectable, NotFoundException, ForbiddenException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Channel } from 'src/entities/channels.entity';
import { User } from 'src/entities/user.entity';

//Servicio para manejar la lógica relacionada con los canales
@Injectable()
export class ChannelsService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelrepository: Repository<Channel>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /*============================================================
    Crear un canal
    ============================================================*/
    async createChannel(name: string, creatorId: number, description?: string, isPublic = true, type: 'channel' | 'dm' = 'channel') {
        const creator = await this.userRepository.findOne({ where: { idUser: creatorId }, select: ['idUser', 'username', 'email'] });
        // ✅ DEBUG DETALLADO
        console.log('🔍 DEBUG - Buscando usuario creador:', { creatorId });
        if (!creator) {
            console.error('❌ Usuario no encontrado con ID:', creatorId);
            throw new NotFoundException('Usuario no encontrado');
        }

        console.log('✅ Usuario creador encontrado:', {
            id: creator.idUser,
            username: creator.username
        });

        // ✅ VERIFICACIÓN MEJORADA: Rechazar explícitamente DMs
        if (type === 'dm') {
            throw new ForbiddenException('Use el endpoint /chat/private para crear DMs');
        }

        // ✅ FORZAR TIPO CHANNEL - Ignorar cualquier otro valor
        const channelType: 'channel' = 'channel';

        console.log('📝 Creando canal:', {
            name,
            isPublic,
            type: channelType, //Siempre será 'channel'
            creatorId: creator.idUser,
            creatorUsername: creator.username
        });

        //Verificar solo para canales públicos con mismo nombre
        if (isPublic) {
            const existing = await this.channelrepository.findOne({ 
                where: { name, isPublic, type: channelType } 
            });
            if (existing) throw new ForbiddenException('Ya existe un canal con ese nombre');
        }

        //CREAR CON TIPO FIJO
        const channel = this.channelrepository.create({
            name,
            creator,
            description: description || '',
            isPublic,
            type: channelType, 
            members: [creator],
        });

        const savedChannel = await this.channelrepository.save(channel);
        
        console.log('✅ Canal creado exitosamente:', {
            id: savedChannel.idChannel,
            name: savedChannel.name,
            type: savedChannel.type,
            isPublic: savedChannel.isPublic
        });

        return savedChannel;
    }

    /*============================================================
    Obtener canales públicos con información de membresía del usuario
    ============================================================*/
    async getPublicChannelsWithMembership(userId: number) {
        const publicChannels = await this.channelrepository.find({
            where: { 
                isPublic: true, 
                type: 'channel'
            },
            relations: ['creator', 'members'],
            order: { createdAt: "DESC" },
        });

        // Formatear respuesta con información de membresía
        return publicChannels.map(channel => {
            const isMember = channel.members.some(member => member.idUser === userId);
            
            return {
                idChannel: channel.idChannel,
                name: channel.name,
                description: channel.description,
                isPublic: channel.isPublic,
                creator: {
                    idUser: channel.creator.idUser,
                    username: channel.creator.username
                },
                membersCount: channel.members.length,
                isMember: isMember,
                createdAt: channel.createdAt
            };
        });
    }
    
    /*============================================================
    Unirse a un canal público
    ============================================================*/
    async joinPublicChannel(channelId: number, userId: number) {
        // Verificar que el canal existe y es público
        const channel = await this.channelrepository.findOne({
            where: { idChannel: channelId },
            relations: ['creator', 'members'],
        });

        if (!channel) {
            throw new NotFoundException('Canal no encontrado');
        }

        if (!channel.isPublic) {
            throw new ForbiddenException('No puedes unirte a un canal privado sin invitación');
        }

        // Verificar si el usuario ya es miembro
        const isMember = channel.members.some(member => member.idUser === userId);
        if (isMember) {
            throw new ForbiddenException('Ya eres miembro de este canal');
        }

        // Obtener el usuario
        const user = await this.userRepository.findOne({ 
            where: { idUser: userId } 
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Agregar usuario al canal
        channel.members.push(user);
        const updatedChannel = await this.channelrepository.save(channel);

        // Formatear respuesta
        return {
            idChannel: updatedChannel.idChannel,
            name: updatedChannel.name,
            description: updatedChannel.description,
            isPublic: updatedChannel.isPublic,
            type: updatedChannel.type,
            isDM: false,
            creator: {
                idUser: updatedChannel.creator.idUser,
                username: updatedChannel.creator.username
            },
            members: updatedChannel.members.map(member => ({
                idUser: member.idUser,
                username: member.username,
                name: member.name
            })),
            membersCount: updatedChannel.members.length,
            createdAt: updatedChannel.createdAt
        };
    }

    /*============================================================
    Obtener canales del usuario actual
    ============================================================*/
    async getUserChannels(userId: number) {
        const userChannels = await this.channelrepository
            .createQueryBuilder('channel')
            .leftJoinAndSelect('channel.members', 'member')
            .leftJoinAndSelect('channel.creator', 'creator')
            .where('member.idUser = :userId', { userId })
            .andWhere('channel.type = :type', { type: 'channel' })
            .orderBy('channel.createdAt', 'DESC')
            .getMany();

        // Formatear respuesta
        return userChannels.map(channel => ({
            idChannel: channel.idChannel,
            name: channel.name,
            description: channel.description,
            isPublic: channel.isPublic,
            type: channel.type,
            isDM: channel.type === 'dm',
            creator: {
                idUser: channel.creator.idUser,
                username: channel.creator.username
            },
            members: channel.members.map(member => ({
                idUser: member.idUser,
                username: member.username,
                name: member.name
            })),
            membersCount: channel.members.length,
            createdAt: channel.createdAt,
            unreadCount: 0 // Puedes implementar lógica de mensajes no leídos
        }));
    }

    /*============================================================
    Listar todos los canales públicos (método simple - sin membresía)
    ============================================================*/
    async getAllPublicChannels(){
        return this.channelrepository.find({
            where: {isPublic: true, type: 'channel'},
            order: {createdAt: "DESC"},
            relations: ['creator'],
        });
    }

    
    /*============================================================
    Obtener un canal por ID
    ============================================================*/
    async getChannelById(idChannel: number){
        const channel = await this.channelrepository.findOne({
            where: { idChannel },
            relations: ['creator', 'members'],
        });
        if (!channel) throw new NotFoundException('Canal no encontrado');
        return channel;
    }

    /*============================================================
    Actualizar canal (nombre, descripcion, visibilidad)
    Solo el creador puede hacerlo
    ============================================================*/
    async updateChannel(
        idChannel: number,
        data: { name?: string; description?: string; isPublic?: boolean },
        idUser: number, 
        ) {
        //Cargar el canal con todas sus relaciones
        const channel = await this.channelrepository.findOne({
            where: { idChannel },
            relations: ['creator', 'members'],
        });

        if (!channel) throw new NotFoundException('Canal no encontrado');

        //Solo el creador puede editar
        if (channel.creator.idUser !== idUser) {
            throw new ForbiddenException('Solo el creador puede modificar este canal');
        }

        //Actualizar solo los campos enviados
        if(data.name !== undefined) channel.name = data.name;
        if(data.description !== undefined) channel.description = data.description;
        if(data.isPublic !== undefined) channel.isPublic = data.isPublic;

        //Asegurar que el creador siempre se mantenga vinculado
        if (!channel.members.some((m) => m.idUser === channel.creator.idUser)) {
            channel.members.push(channel.creator);
        }

        //Guardar cambios sin perder relaciones
        return await this.channelrepository.save(channel);
    }


    /*============================================================
    Eliminar un canal
    Solo el creador o administrador puede hacerlo
    ============================================================*/
    async removeChannel(idChannel: number, idUser: number) {
        try {
            //Buscar canal con relaciones
            const channel = await this.channelrepository.findOne({
                where: { idChannel },
                relations: ['creator', 'members'],
            });
            
            if (!channel) {
            throw new NotFoundException(`Canal con ID ${idChannel} no encontrado`);
            }

            // Verificar permisos según el tipo de canal
            if (channel.isPublic) {
            //Para canales públicos: solo el creador puede eliminar
            if (channel.creator.idUser !== idUser) {
                throw new ForbiddenException('Solo el creador puede eliminar este grupo');
            }
            } else {
            //Para DM: verificar que el usuario es miembro del DM
            const isMember = channel.members.some(member => member.idUser === idUser);
            if (!isMember) {
                throw new ForbiddenException('No eres miembro de este chat privado');
            }
            }

            //Eliminar el canal
            await this.channelrepository.delete(idChannel);
            return { message: `Canal "${channel.name}" eliminado correctamente` };
        } catch (error) {
            console.error("🔴 ERROR in removeChannel:", error);
            throw error;
        }
    }


    /*============================================================
    Agregar todos los usuarios a un canal publico
    ============================================================*/
    async addAllUsersToPublicChannel(channelId: number): Promise<void>{
        const channel = await this.channelrepository.findOne({
            where: {idChannel: channelId},
            relations: ['members']
        });

        if(!channel){
            throw new NotFoundException('Canal no encontrado')
        }
        //Obtener todos los usuarios
        const allUsers = await this.userRepository.find();

        //Agregar todos los usuarios al canal (Evitar duplicados)
        const existingMemberIds = channel.members.map(member => member.idUser);
        const newUsers = allUsers.filter(user => !existingMemberIds.includes(user.idUser));

        channel.members = [...channel.members, ...newUsers]

        await this.channelrepository.save(channel)
    }

    /*============================================================
    Obtener los usuarios de un canal
    ============================================================*/
    async getUsersForChannel(channelId: number, currentUserId: number) {
        const channel = await this.channelrepository.findOne({
            where: { idChannel: channelId },
            relations: ['members', 'creator'],
        });
        if (!channel) throw new NotFoundException('Canal no encontrado');

        if (channel.isPublic && channel.type === 'channel') {
            const allUsers = await this.userRepository.find({
                where: { idUser: Not(currentUserId) }
            });
            
            return {
                channel,
                currentMembers: channel.members,
                availableUsers: allUsers,
                isPublic: true
            };
        } else {
            const nonMemberUsers = await this.userRepository
                .createQueryBuilder('user')
                .where('user.idUser != :currentUserId', { currentUserId })
                .andWhere('user.idUser NOT IN (:...memberIds)', {
                    memberIds: channel.members.map(m => m.idUser)
                })
                .getMany();

            return {
                channel,
                currentMembers: channel.members,
                availableUsers: nonMemberUsers,
                isPublic: false
            };
        }
    }
    /*============================================================
    Agregar un usuario a un canal
    ============================================================*/
    async addUserToChannel(idChannel: number, username: string) {
        const channel = await this.channelrepository.findOne({
            where: { idChannel },
            relations: ['members'],
        });
        if (!channel) throw new NotFoundException('Canal no encontrado');
        
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const alreadyMember = channel.members.some((u) => u.idUser === user.idUser);
        if (alreadyMember) {
        throw new ForbiddenException('El usuario ya pertenece a este canal');
        }

        channel.members.push(user);
        return this.channelrepository.save(channel);
    }

    /*============================================================
    Expulsar (eliminar) a un usuario del canal
    ============================================================*/
    async removeUserFromChannel(idChannel: number, userId: number) {
        const channel = await this.channelrepository.findOne({
            where: { idChannel },
            relations: ['members'],
        });
        if (!channel) throw new NotFoundException('Canal no encontrado');

        const userExists = channel.members.some((u) => u.idUser === userId);
        if (!userExists) throw new ForbiddenException('El usuario no pertenece a este canal');

        channel.members = channel.members.filter((u) => u.idUser !== userId);
        await this.channelrepository.save(channel);

        return { message: `Usuario eliminado del canal "${channel.name}"` };
    }

    /*============================================================
     Salir de un canal
    ============================================================*/
    async leaveChannel(idChannel: number, idUser: number) {
        const channel = await this.channelrepository.findOne({
            where: { idChannel },
            relations: ['members'],
        });
        if (!channel) throw new NotFoundException('Canal no encontrado');

        const user = await this.userRepository.findOne({ where: { idUser } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const isMember = channel.members.some((m) => m.idUser === idUser);
        if (!isMember) throw new ForbiddenException('No perteneces a este canal');

        if (channel.type === 'dm') {
            throw new ForbiddenException('No puedes salir de un chat privado. Debes eliminarlo completamente.');
        }

        channel.members = channel.members.filter((m) => m.idUser !== idUser);
        await this.channelrepository.save(channel);

        if (!channel.isPublic && channel.members.length === 0) {
            await this.channelrepository.remove(channel);
            return { message: 'Saliste del canal. El canal fue eliminado porque quedó vacío.' };
        }

        return { message: 'Has salido del canal correctamente' };
    }
}
