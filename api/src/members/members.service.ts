import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMemberDto) {
    return this.prisma.member.create({ data: dto });
  }

  // Marca como VENCIDO las membresias cuya fecha ya paso (barrido idempotente).
  private markExpired() {
    return this.prisma.membership.updateMany({
      where: { endDate: { lt: new Date() }, status: { not: 'VENCIDO' } },
      data: { status: 'VENCIDO' },
    });
  }

  async findAll(search?: string, page = 1, limit = 10, status?: string) {
    await this.markExpired();
    const where: Prisma.MemberWhereInput | undefined = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { identification: { contains: search } },
          ],
        }
      : undefined;

    // Traemos cada cliente con SOLO su membresia mas reciente (take: 1) para
    // derivar su estado actual. El filtro por estado se aplica sobre ese estado
    // derivado, por eso se pagina en memoria: garantiza que el chip "Vencidos"
    // muestre exactamente los que la fila marca como VENCIDO (no historicos).
    const members = await this.prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
    });

    // Dos dimensiones INDEPENDIENTES por membresia:
    //   expired = ya paso su fecha de fin (dimension TIEMPO)
    //   owes    = todavia tiene saldo pendiente (dimension PAGO)
    // Pueden coexistir: una membresia vencida que ademas no termino de pagarse.
    const now = new Date();
    const enriched = members.map((m) => {
      const last = m.memberships[0];
      const hasMembership = !!last;
      const balance = last ? Number(last.balance) : 0;
      return {
        id: m.id,
        identification: m.identification,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone,
        email: m.email,
        active: m.active,
        planName: last?.plan.name ?? null,
        endDate: last?.endDate ?? null,
        balance,
        hasMembership,
        expired: hasMembership ? last.endDate < now : false,
        owes: balance > 0,
      };
    });

    const filtered =
      status && status !== 'TODOS'
        ? enriched.filter((m) => {
            if (status === 'VENCIDO') return m.expired;
            if (status === 'PENDIENTE') return m.owes;
            if (status === 'PAGADO')
              return m.hasMembership && !m.expired && !m.owes;
            return true;
          })
        : enriched;

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    await this.markExpired();
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            plan: true,
            payments: { orderBy: { paidAt: 'desc' } },
            freezes: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return member;
  }

  async update(id: string, dto: UpdateMemberDto) {
    await this.findOne(id);
    try {
      return await this.prisma.member.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException(
          'Ya existe otro cliente con esa identificacion',
        );
      }
      throw e;
    }
  }

  // Delete REAL: solo si el cliente no tiene historial (membresias/pagos).
  // Si lo tiene, se debe DESACTIVAR (active=false) para no romper la contabilidad.
  async remove(id: string) {
    const member = await this.findOne(id);
    if (member.memberships.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar: el cliente tiene historial (membresias/pagos). Desactivalo en su lugar.',
      );
    }
    await this.prisma.member.delete({ where: { id } });
    return { deleted: true, id };
  }
}
