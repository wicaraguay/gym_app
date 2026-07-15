import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un abono. TODO ocurre dentro de una transaccion para que
   * no haya estados a medias (ej. cobrar pero no descontar el saldo).
   * Usamos Prisma.Decimal para NO tener errores de redondeo con dinero.
   */
  async create(dto: CreatePaymentDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: dto.membershipId },
      });
      if (!membership) {
        throw new NotFoundException('Membresia no encontrada');
      }
      if (membership.status === 'PAGADO') {
        throw new BadRequestException('Esta membresia ya esta pagada por completo');
      }

      const amount = new Prisma.Decimal(dto.amount);
      if (amount.lte(0)) {
        throw new BadRequestException('El monto debe ser positivo');
      }
      if (amount.gt(membership.balance)) {
        throw new BadRequestException(
          `El abono (${amount}) supera el saldo pendiente (${membership.balance})`,
        );
      }

      // 1) Registrar el abono
      const payment = await tx.payment.create({
        data: {
          membershipId: dto.membershipId,
          amount,
          method: dto.method ?? 'EFECTIVO',
          registeredById: userId,
        },
      });

      // 2) Descontar del saldo y actualizar el estado
      const newBalance = membership.balance.minus(amount);
      const fullyPaid = newBalance.lte(0);
      const expired = membership.endDate < new Date();

      await tx.membership.update({
        where: { id: membership.id },
        data: {
          balance: newBalance,
          status: expired ? 'VENCIDO' : fullyPaid ? 'PAGADO' : 'PENDIENTE',
        },
      });

      // La nota de venta se entrega FISICA (a mano). El sistema solo lleva
      // el registro del pago y el estado de la membresia.
      return { payment, newBalance, fullyPaid };
    });
  }
}
