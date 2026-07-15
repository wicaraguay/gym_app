import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { IdentificationType } from '@prisma/client';

export class UpdateMemberDto {
  @IsEnum(IdentificationType)
  @IsOptional()
  identificationType?: IdentificationType;

  @IsString()
  @IsOptional()
  identification?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
