import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(4) password: string;
  @IsIn(['ADMIN', 'RECEPCIONISTA']) role: 'ADMIN' | 'RECEPCIONISTA';
}
