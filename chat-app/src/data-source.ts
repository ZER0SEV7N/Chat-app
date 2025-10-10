import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config(); // Si usas .env para credenciales, descomenta esto

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'chatuser',
    password: '1234',
    database: 'chatdb',

    // **Rutas corregidas para que ts-node las pueda encontrar inmediatamente**
    entities: [
        "src/database/entities/*.entity.ts" // O la ruta correcta a tus entidades .ts
    ],
    migrations: [
        "src/database/migrations/*.ts" // <--- ¡CAMBIADO A .ts!
    ],

    synchronize: false,
    logging: true,
});

export default AppDataSource;