import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { FreezeMembershipDto } from './dto/freeze-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

// El selector de fecha manda "YYYY-MM-DD". `new Date("2025-07-01")` lo toma
// como MEDIANOCHE UTC, y en Ecuador (UTC-5) eso cae el dia anterior a las 19h,
// asi que en pantalla se veia "30 de junio". Anclamos al MEDIODIA UTC: con ese
// margen de +/-11h, la fecha representa el mismo dia calendario en cualquier
// huso de America. Si viene con hora (ISO completo, ej. continuar al vencer),
// se respeta tal cual.
function parseCalendarDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }
  return new Date(value);
}

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMembershipDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.active) {
      throw new BadRequestException('Plan invalido o inactivo');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });
    if (!member) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // REGLA: un cliente solo puede tener UNA membresia activa a la vez.
    // Si ya tiene una vigente (endDate futuro), no se puede inscribir otra
    // hasta que venza.
    const now = new Date();
    const active = await this.prisma.membership.findFirst({
      where: { memberId: dto.memberId, endDate: { gt: now } },
      orderBy: { endDate: 'desc' },
    });
    // Si ya tiene una activa: se bloquea, SALVO que sea compra anticipada
    // (en ese caso la nueva arranca cuando termina la actual).
    if (active && !dto.startAfterCurrent) {
      const d = active.endDate;
      const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}/${d.getFullYear()}`;
      throw new BadRequestException(
        `El cliente ya tiene una membresia activa (vence el ${fecha}). Podras inscribir una nueva cuando venza, o usar compra anticipada.`,
      );
    }

    const start = dto.startDate
      ? parseCalendarDate(dto.startDate)
      : active && dto.startAfterCurrent
        ? new Date(active.endDate)
        : now;

    // CANTIDAD: cuantos periodos del plan paga (ej. 3 meses = una membresia
    // que dura 3 meses y cuesta 3x el precio del plan).
    const qty = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;

    // VENCIMIENTO: meses de calendario (o dias) x cantidad.
    const end = new Date(start);
    if (plan.durationMonths > 0) {
      end.setMonth(end.getMonth() + plan.durationMonths * qty);
    } else {
      end.setDate(end.getDate() + plan.durationDays * qty);
    }

    const total = plan.price.mul(qty); // precio congelado x cantidad

    return this.prisma.membership.create({
      data: {
        memberId: dto.memberId,
        planId: dto.planId,
        priceSnapshot: total, // CONGELAMOS el precio total
        balance: total, // saldo inicial = precio total
        startDate: start,
        endDate: end,
        status: 'PENDIENTE',
      },
      include: { plan: true, payments: true },
    });
  }

  // Congela UNA membresia dentro de una transaccion: corre su vencimiento N
  // dias y DESPLAZA la cola detras (las del mismo cliente que arrancan cuando
  // esta terminaba, o despues) los mismos N dias, para que no se solapen.
  // No registra el freeze ni cuenta dias congelados en las desplazadas: ellas
  // solo se corren en el calendario, su duracion no cambia.
  private async freezeOneTx(
    tx: Prisma.TransactionClient,
    m: { id: string; memberId: string; endDate: Date; frozenDays: number },
    days: number,
  ) {
    const oldEnd = m.endDate;
    const newEnd = new Date(oldEnd);
    newEnd.setDate(newEnd.getDate() + days);

    await tx.membership.update({
      where: { id: m.id },
      data: { endDate: newEnd, frozenDays: m.frozenDays + days },
    });

    const queued = await tx.membership.findMany({
      where: {
        memberId: m.memberId,
        id: { not: m.id },
        startDate: { gte: oldEnd },
      },
    });
    for (const q of queued) {
      const qStart = new Date(q.startDate);
      qStart.setDate(qStart.getDate() + days);
      const qEnd = new Date(q.endDate);
      qEnd.setDate(qEnd.getDate() + days);
      await tx.membership.update({
        where: { id: q.id },
        data: { startDate: qStart, endDate: qEnd },
      });
    }
  }

  // Congelar: corre el vencimiento X dias, desplaza la cola y registra el evento.
  async freeze(membershipId: string, dto: FreezeMembershipDto, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });
    if (!membership) {
      throw new NotFoundException('Membresia no encontrada');
    }

    // Solo se puede congelar la membresia VIGENTE (ya empezo y no vencio).
    // Una en cola no empezo (no hay nada que pausar) y una vencida ya termino.
    const now = new Date();
    if (membership.startDate > now) {
      throw new BadRequestException(
        'Esta membresia esta en cola (aun no empieza). Se podra congelar cuando este vigente.',
      );
    }
    if (membership.endDate <= now) {
      throw new BadRequestException(
        'Esta membresia ya vencio. No se puede congelar.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.freezeOneTx(tx, membership, dto.days);
      await tx.membershipFreeze.create({
        data: {
          membershipId,
          days: dto.days,
          reason: dto.reason,
          createdById: userId,
        },
      });
      return tx.membership.findUnique({ where: { id: membershipId } });
    });
  }

  // Congelamiento MASIVO: corre N dias a las membresias VIGENTES (feriados,
  // mudanza de local, etc). Las que estan en cola detras de una vigente se
  // desplazan solas (via freezeOneTx), NO se congelan aparte: asi no se mueve
  // una futura que no corresponde ni se cuenta dos veces.
  async freezeAll(dto: FreezeMembershipDto, userId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const vigentes = await tx.membership.findMany({
          where: { startDate: { lte: now }, endDate: { gt: now } },
        });
        if (vigentes.length === 0) {
          return { affected: 0 };
        }
        // batchId comun: agrupa este masivo para poder revertirlo completo.
        const batchId = randomUUID();
        for (const m of vigentes) {
          await this.freezeOneTx(tx, m, dto.days);
        }
        await tx.membershipFreeze.createMany({
          data: vigentes.map((m) => ({
            membershipId: m.id,
            days: dto.days,
            reason: dto.reason,
            bulk: true, // vino de un congelamiento masivo
            batchId,
            createdById: userId,
          })),
        });
        return { affected: vigentes.length, batchId };
      },
      { timeout: 30000 },
    );
  }

  // Revierte UN congelamiento dentro de una transaccion: resta sus dias al
  // vencimiento, corre la cola detras hacia atras (para mantenerla contigua) y
  // borra el registro. Es la inversa exacta de freezeOneTx.
  private async unfreezeOneTx(
    tx: Prisma.TransactionClient,
    freeze: { id: string; membershipId: string; days: number },
  ) {
    const m = await tx.membership.findUnique({
      where: { id: freeze.membershipId },
    });
    if (!m) {
      // Sin membresia no hay nada que revertir; limpiamos el registro suelto.
      await tx.membershipFreeze.delete({ where: { id: freeze.id } });
      return;
    }
    const days = freeze.days;
    const curEnd = m.endDate;
    const newEnd = new Date(curEnd);
    newEnd.setDate(newEnd.getDate() - days);

    const queued = await tx.membership.findMany({
      where: {
        memberId: m.memberId,
        id: { not: m.id },
        startDate: { gte: curEnd },
      },
    });
    for (const q of queued) {
      const qStart = new Date(q.startDate);
      qStart.setDate(qStart.getDate() - days);
      const qEnd = new Date(q.endDate);
      qEnd.setDate(qEnd.getDate() - days);
      await tx.membership.update({
        where: { id: q.id },
        data: { startDate: qStart, endDate: qEnd },
      });
    }

    await tx.membership.update({
      where: { id: m.id },
      data: { endDate: newEnd, frozenDays: Math.max(0, m.frozenDays - days) },
    });
    await tx.membershipFreeze.delete({ where: { id: freeze.id } });
  }

  // Cancela UN congelamiento INDIVIDUAL. Un masivo no se deshace cliente por
  // cliente: se revierte completo desde el Dashboard (cancelBatch).
  async cancelFreeze(freezeId: string) {
    const freeze = await this.prisma.membershipFreeze.findUnique({
      where: { id: freezeId },
    });
    if (!freeze) {
      throw new NotFoundException('Congelamiento no encontrado');
    }
    if (freeze.bulk) {
      throw new BadRequestException(
        'Es parte de un congelamiento masivo. Revertilo completo desde el Dashboard.',
      );
    }
    await this.prisma.$transaction((tx) => this.unfreezeOneTx(tx, freeze));
    return { reverted: 1, days: freeze.days };
  }

  // Lista los congelamientos masivos ACTIVOS (agrupados por batch). Cada uno
  // trae dias, motivo, cuantos clientes abarca y cuando se aplico. Los ya
  // revertidos no aparecen (sus registros se borraron).
  async listBatches() {
    const groups = await this.prisma.membershipFreeze.groupBy({
      by: ['batchId'],
      where: { batchId: { not: null } },
      _count: { _all: true },
      _max: { days: true, reason: true, createdAt: true },
    });
    return groups
      .map((g) => ({
        batchId: g.batchId as string,
        count: g._count._all,
        days: g._max.days,
        reason: g._max.reason,
        createdAt: g._max.createdAt,
      }))
      .sort((a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
  }

  // Revierte un congelamiento MASIVO completo: le quita los dias a TODOS los
  // clientes que lo recibieron. Solo ADMIN, igual que aplicarlo.
  async cancelBatch(batchId: string) {
    const freezes = await this.prisma.membershipFreeze.findMany({
      where: { batchId },
    });
    if (freezes.length === 0) {
      throw new NotFoundException('Congelamiento masivo no encontrado');
    }
    await this.prisma.$transaction(
      async (tx) => {
        for (const f of freezes) {
          await this.unfreezeOneTx(tx, f);
        }
      },
      { timeout: 30000 },
    );
    return { reverted: freezes.length, days: freezes[0].days };
  }

  // Editar una membresia (plan/cantidad). Recalcula precio congelado,
  // vencimiento y saldo (restando lo ya pagado), y conserva los pagos.
  // Si cambia el vencimiento y hay cola detras, la corre para no solapar.
  async update(id: string, dto: UpdateMembershipDto) {
    return this.prisma.$transaction(async (tx) => {
      const m = await tx.membership.findUnique({
        where: { id },
        include: { payments: true },
      });
      if (!m) {
        throw new NotFoundException('Membresia no encontrada');
      }
      const plan = await tx.plan.findUnique({ where: { id: dto.planId } });
      if (!plan || !plan.active) {
        throw new BadRequestException('Plan invalido o inactivo');
      }
      const qty = dto.quantity > 0 ? dto.quantity : 1;

      const newEnd = new Date(m.startDate);
      if (plan.durationMonths > 0) {
        newEnd.setMonth(newEnd.getMonth() + plan.durationMonths * qty);
      } else {
        newEnd.setDate(newEnd.getDate() + plan.durationDays * qty);
      }

      const total = plan.price.mul(qty);
      const paid = m.payments.reduce(
        (sum, p) => sum.plus(p.amount),
        new Prisma.Decimal(0),
      );
      let balance = total.minus(paid);
      if (balance.lt(0)) balance = new Prisma.Decimal(0); // pago de mas: se maneja aparte
      const expired = newEnd < new Date();
      const status = expired ? 'VENCIDO' : balance.lte(0) ? 'PAGADO' : 'PENDIENTE';

      // Correr la cola detras por la diferencia de vencimiento.
      const delta = newEnd.getTime() - m.endDate.getTime();
      if (delta !== 0) {
        const queued = await tx.membership.findMany({
          where: {
            memberId: m.memberId,
            id: { not: m.id },
            startDate: { gte: m.endDate },
          },
        });
        for (const q of queued) {
          await tx.membership.update({
            where: { id: q.id },
            data: {
              startDate: new Date(q.startDate.getTime() + delta),
              endDate: new Date(q.endDate.getTime() + delta),
            },
          });
        }
      }

      return tx.membership.update({
        where: { id },
        data: {
          planId: plan.id,
          priceSnapshot: total,
          endDate: newEnd,
          balance,
          status,
        },
        include: { plan: true, payments: true },
      });
    });
  }

  // Borrar una membresia (creada por error). Borra tambien sus pagos y
  // congelamientos. Solo ADMIN (se avisa en la UI si tiene pagos).
  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const m = await tx.membership.findUnique({ where: { id } });
      if (!m) {
        throw new NotFoundException('Membresia no encontrada');
      }
      await tx.payment.deleteMany({ where: { membershipId: id } });
      await tx.membershipFreeze.deleteMany({ where: { membershipId: id } });
      await tx.membership.delete({ where: { id } });
      return { deleted: true, id };
    });
  }

  async findOne(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        plan: true,
        member: true,
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!membership) {
      throw new NotFoundException('Membresia no encontrada');
    }
    return membership;
  }
}
