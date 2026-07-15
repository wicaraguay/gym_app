import { IsEmail, IsOptional, IsString } from 'class-validator';

// Datos que un usuario puede editar de SU PROPIO perfil (no el rol ni active).
export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() cedula?: string;
  @IsOptional() @IsString() address?: string;
}
