import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsString() @IsNotEmpty() @MaxLength(160) contact: string; // email o telefono
  @IsString() @IsNotEmpty() @MaxLength(2000) message: string;
}
