import { IsNotEmpty } from "class-validator";

export class LoginDTO{
    @IsNotEmpty({message: 'Porfavor colocar su nombre de usuario'})
    username: string;
    
    @IsNotEmpty({message: 'Porfavor colocar su contraseña '})
    password: string;
}