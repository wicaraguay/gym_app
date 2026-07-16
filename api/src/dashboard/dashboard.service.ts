import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // Notificaciones de la campanita. Dos tipos:
  //  - 'cobro'  : saldo pendiente y ultimo abono (o inscripcion) hace >= 5 dias.
  //  - 'vencer' : membresia vigente que vence en los proximos 5 dias.
  async notifications() {
    const now = new Date();
    const soon = new Date(now.getTime() + 5 * 86400000);

    const pending = await this.prisma.membership.findMany({
      where: { balance: { gt: 0 } },
      include: {
        member: true,
        payments: { orderBy: { paidAt: 'desc' }, take: 1 },
      },
    });
    const cobros = pending
      .map((m) => {
        const last = m.payments[0]?.paidAt ?? m.createdAt;
        const daysSince = Math.floor(
          (now.getTime() - new Date(last).getTime()) / 86400000,
        );
        return {
          type: 'cobro' as const,
          membershipId: m.id,
          memberId: m.memberId,
          memberName: `${m.member.firstName} ${m.member.lastName}`,
          balance: Number(m.balance),
          daysSince,
        };
      })
      .filter((n) => n.daysSince >= 5)
      .sort((a, b) => b.daysSince - a.daysSince);

    const expiring = await this.prisma.membership.findMany({
      where: { endDate: { gte: now, lte: soon }, status: { not: 'VENCIDO' } },
      include: { member: true },
    });
    const porVencer = expiring
      .map((m) => ({
        type: 'vencer' as const,
        membershipId: m.id,
        memberId: m.memberId,
        memberName: `${m.member.firstName} ${m.member.lastName}`,
        daysLeft: Math.max(
          0,
          Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / 86400000),
        ),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return [...cobros, ...porVencer];
  }

  async summary() {
    const now = new Date();
    // Inicio de mes en hora de ECUADOR (UTC-5, sin horario de verano), expresado
    // como instante UTC. Sin esto el corte caeria a medianoche UTC = 19h del dia
    // anterior en Ecuador, y un pago hecho de noche el ultimo dia del mes se
    // contaria en el mes siguiente. Medianoche EC del dia 1 = 05:00 UTC del dia 1.
    // Calculado con offset explicito: correcto sin importar la TZ del contenedor.
    const EC_OFFSET_HOURS = 5;
    const ecNow = new Date(now.getTime() - EC_OFFSET_HOURS * 3600000);
    const monthStart = new Date(
      Date.UTC(ecNow.getUTCFullYear(), ecNow.getUTCMonth(), 1, EC_OFFSET_HOURS, 0, 0),
    );

    // Marca vencidas antes de contar (mantiene los numeros correctos).
    await this.prisma.membership.updateMany({
      where: { endDate: { lt: now }, status: { not: 'VENCIDO' } },
      data: { status: 'VENCIDO' },
    });

    const [income, totalMembers, activeMembers, byStatus, pending, recent] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { paidAt: { gte: monthStart } },
        }),
        this.prisma.member.count(),
        this.prisma.member.count({ where: { active: true } }),
        this.prisma.membership.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.membership.aggregate({
          _sum: { balance: true },
          where: { status: { not: 'PAGADO' } },
        }),
        this.prisma.payment.findMany({
          take: 8,
          orderBy: { paidAt: 'desc' },
          include: {
            membership: { include: { member: true, plan: true } },
          },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s.status] = s._count._all;
    }

    return {
      monthlyIncome: Number(income._sum.amount ?? 0),
      totalMembers,
      activeMembers,
      paidMemberships: statusMap['PAGADO'] ?? 0,
      pendingMemberships: statusMap['PENDIENTE'] ?? 0,
      pendingBalance: Number(pending._sum.balance ?? 0),
      recentPayments: recent.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paidAt: p.paidAt,
        member: `${p.membership.member.firstName} ${p.membership.member.lastName}`,
        plan: p.membership.plan.name,
      })),
    };
  }
}
