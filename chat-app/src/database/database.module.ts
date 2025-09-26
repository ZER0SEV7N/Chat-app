//Modulo encargado de la conexion a la base de datos

//Importaciones necesarias:
import { Module } from '@nestjs/common'; //Modulo de NestJS
import { TypeOrmModule} from '@nestjs/typeorm'; //Modulo de TypeORM para la conexion a la base de datos

//Definicion del modulo DatabaseModule
@Module({
    //Configuracion de la conexion a la base de datos
    imports: [TypeOrmModule.forRoot({
        type: 'postgres', //Tipo de base de datos
        host: 'localhost', //Host de la base de datos
        port: 5432, //Puerto de la base de datos
        username: 'postgres', //Usuario de la base de datos
        password: '12345', //Contraseña de la base de datos
        database: 'chatdb', //Nombre de la base de datos
        autoLoadEntities: true, //Carga automatica de entidades
        synchronize: true, //Sincronizacion de la base de datos (solo en desarrollo)
    })
    ]
})
export class DatabaseModule {}