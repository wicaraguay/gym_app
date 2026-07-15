import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FreezeMembershipDto {
  @IsInt()
  @Min(1)
  @Max(90) // tope de seguridad: no congelar mas de 90 dias de una
  days: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
