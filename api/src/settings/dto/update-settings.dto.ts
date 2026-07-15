import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString() @IsOptional() businessName?: string;
  @IsString() @IsOptional() ownerName?: string;
  @IsString() @IsOptional() ruc?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() photoUrl?: string;
}
