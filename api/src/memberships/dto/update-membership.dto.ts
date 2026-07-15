import { IsInt, IsString, Min } from 'class-validator';

// Editar una membresia existente: cambiar el plan y/o la cantidad de periodos.
// Se recalcula precio, vencimiento y saldo, conservando los pagos ya hechos.
export class UpdateMembershipDto {
  @IsString() planId: string;
  @IsInt() @Min(1) quantity: number;
}
