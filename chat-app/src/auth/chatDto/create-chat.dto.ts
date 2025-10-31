//Importar funciones del class validator para los chats
import { IsNotEmpty, IsString, IsInt, MinLength, } from 'class-validator';
//Exportar los chat
export class CreateChatDto {
    @IsInt({ message: 'El ID del canal debe ser un número entero' })
    @IsNotEmpty ({ message: 'El ID del canal no puede estar vacío' })
    idChannel: number;

    @IsString({ message: 'El nombre del canal debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre del canal no puede estar vacío'})
    @MinLength(1, { message: 'El nombre del canal debe tener al menos un carácter' })
    text:string;
}
