import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationMonths?: number;
}
