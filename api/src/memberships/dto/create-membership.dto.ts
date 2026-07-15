import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMembershipDto {
  @IsString()
  memberId: string;

  @IsString()
  planId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number; // cuantos periodos del plan (ej. 3 = 3 meses)

  // Compra anticipada: si el cliente tiene una membresia vigente, la nueva
  // arranca cuando esa termina (para promos como Black Friday).
  @IsBoolean()
  @IsOptional()
  startAfterCurrent?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}
