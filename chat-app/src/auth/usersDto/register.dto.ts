//Importar la clases necesarias
import { IsEmail, IsNotEmpty, IsPhoneNumber, MinLength} from 'class-validator'

export class RegisterDTO {
    @IsNotEmpty ({message: 'El nombre es obligatorio'})
    name: string;

    @IsNotEmpty({message: 'El nombre de usuario es obligatorio'})
    username: string;

    @IsEmail({}, {message: 'Debe proporcionar un correo electronico valido'})
    email: string;

    @IsPhoneNumber('PE', {message: 'Debe proporcionar un numero de telefono valido'})
    phone: string;

    @IsNotEmpty({message: 'La contraseña es obligatoria'})
    @MinLength(6, {message: 'La contraseña debe tener almenos 6 caracteres '})
    password: string;
}