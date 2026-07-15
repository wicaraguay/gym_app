import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() cedula?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsIn(['ADMIN', 'RECEPCIONISTA']) role?: 'ADMIN' | 'RECEPCIONISTA';
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @MinLength(4) password?: string;
}
