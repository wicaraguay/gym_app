import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IdentificationType } from '@prisma/client';

export class CreateMemberDto {
  @IsEnum(IdentificationType)
  @IsOptional()
  identificationType?: IdentificationType;

  @IsString()
  @MinLength(3)
  identification: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
