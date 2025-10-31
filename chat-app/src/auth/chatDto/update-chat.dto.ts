import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateChatDto {
  @IsInt({ message: 'El ID del mensaje debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del mensaje es obligatorio.' })
  idMessage: number;

  @IsString({ message: 'El nuevo texto debe ser una cadena.' })
  @IsNotEmpty({ message: 'El texto no puede estar vacío.' })
  @MinLength(1, { message: 'El mensaje debe tener al menos 1 carácter.' })
  newText: string;
}
