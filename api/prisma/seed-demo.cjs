/* eslint-disable */
// Seed de DEMO: crea datos de ejemplo cubriendo TODOS los casos.
// Correr:  docker compose exec -T api node prisma/seed-demo.cjs
// Borrar despues con seed-demo-clear.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');
const prisma = new PrismaClient();

const now = new Date();
const D = (n) => new Date(now.getTime() + n * 86400000);
const addMonths = (date, m) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + m);
  return d;
};

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No hay usuario ADMIN');
  const adminId = admin.id;

  // ---------- PLANES ----------
  const plansData = [
    { name: 'Mensual', price: 40, durationMonths: 1, durationDays: 30, active: true },
    { name: 'Trimestral', price: 105, durationMonths: 3, durationDays: 30, active: true },
    { name: 'Black Friday', price: 70, durationMonths: 3, durationDays: 30, active: true },
    { name: 'Anual', price: 350, durationMonths: 12, durationDays: 30, active: true },
    { name: 'Quincenal', price: 25, durationMonths: 0, durationDays: 15, active: true },
    { name: 'Semana de prueba', price: 10, durationMonths: 0, durationDays: 7, active: false },
  ];
  const P = {};
  for (const p of plansData) P[p.name] = await prisma.plan.create({ data: p });

  // ---------- EQUIPO (agrega un recep inactivo, sin tocar los reales) ----------
  await prisma.user.upsert({
    where: { email: 'suplente@crossfit.local' },
    update: {},
    create: {
      email: 'suplente@crossfit.local',
      name: 'Recep Suplente',
      passwordHash: await bcrypt.hash('demo1234', 10),
      role: 'RECEPCIONISTA',
      active: false,
    },
  });

  // ---------- helpers ----------
  let idn = 900000001;
  const nid = () => String(idn++);
  const mkMember = (first, last, opts = {}) =>
    prisma.member.create({
      data: {
        firstName: first,
        lastName: last,
        identification: nid(),
        active: opts.active ?? true,
        phone: opts.phone || null,
      },
    });
  const mkMem = (memberId, plan, o) => {
    let end =
      o.end ||
      (plan.durationMonths > 0
        ? addMonths(o.start, plan.durationMonths * (o.qty || 1))
        : new Date(o.start.getTime() + plan.durationDays * (o.qty || 1) * 86400000));
    if (o.freezeDays && !o.end) end = new Date(end.getTime() + o.freezeDays * 86400000);
    return prisma.membership.create({
      data: {
        memberId,
        planId: plan.id,
        priceSnapshot: Number(plan.price) * (o.qty || 1),
        startDate: o.start,
        endDate: end,
        balance: o.balance,
        status: o.status,
        frozenDays: o.frozenDays || 0,
        createdAt: o.createdAt || o.start,
      },
    });
  };
  const mkPay = (membershipId, amount, method, paidAt) =>
    prisma.payment.create({
      data: { membershipId, amount, method, paidAt, registeredById: adminId },
    });
  const mkFreeze = (membershipId, days, reason, bulk, batchId, createdAt) =>
    prisma.membershipFreeze.create({
      data: { membershipId, days, reason, bulk, batchId, createdById: adminId, createdAt },
    });

  let m, ms, vig, cola;

  // 1. AL DIA (vigente, pagada)
  m = await mkMember('Ana', 'Torres', { phone: '0991111111' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-5), balance: 0, status: 'PAGADO' });
  await mkPay(ms.id, 40, 'EFECTIVO', D(-5));

  // 2. DEBE reciente (no dispara notificacion, pago hace 2 dias)
  m = await mkMember('Bruno', 'Diaz', { phone: '0992222222' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-2), balance: 20, status: 'PENDIENTE' });
  await mkPay(ms.id, 20, 'TRANSFERENCIA', D(-2));

  // 3. NOTIFICACION (debe + ultimo pago hace 8 dias)
  m = await mkMember('Carla', 'Nunez', { phone: '0993333333' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-8), balance: 20, status: 'PENDIENTE' });
  await mkPay(ms.id, 20, 'EFECTIVO', D(-8));

  // 4. VENCIDA pagada (necesita renovar)
  m = await mkMember('Diego', 'Ramos');
  ms = await mkMem(m.id, P['Mensual'], { start: D(-35), balance: 0, status: 'VENCIDO' });
  await mkPay(ms.id, 40, 'EFECTIVO', D(-35));

  // 5. VENCIDA Y DEBE (dispara notificacion)
  m = await mkMember('Elena', 'Vera', { phone: '0995555555' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-40), balance: 15, status: 'VENCIDO' });
  await mkPay(ms.id, 25, 'EFECTIVO', D(-40));

  // 6. VIGENTE + EN COLA sin pagar (compra anticipada)
  m = await mkMember('Fabian', 'Ortiz');
  vig = await mkMem(m.id, P['Mensual'], { start: D(-3), balance: 0, status: 'PAGADO' });
  await mkPay(vig.id, 40, 'EFECTIVO', D(-3));
  await mkMem(m.id, P['Black Friday'], { start: vig.endDate, balance: 70, status: 'PENDIENTE', createdAt: now });

  // 7. VIGENTE + EN COLA pagada por adelantado
  m = await mkMember('Gabriela', 'Suarez');
  vig = await mkMem(m.id, P['Mensual'], { start: D(-1), balance: 0, status: 'PAGADO' });
  await mkPay(vig.id, 40, 'EFECTIVO', D(-1));
  cola = await mkMem(m.id, P['Mensual'], { start: vig.endDate, balance: 0, status: 'PAGADO', createdAt: now });
  await mkPay(cola.id, 40, 'EFECTIVO', now);

  // 8. HISTORIAL (2 vencidas) + vigente
  m = await mkMember('Hugo', 'Pena');
  let h1 = await mkMem(m.id, P['Mensual'], { start: D(-70), balance: 0, status: 'VENCIDO' });
  await mkPay(h1.id, 40, 'EFECTIVO', D(-70));
  let h2 = await mkMem(m.id, P['Mensual'], { start: D(-40), balance: 0, status: 'VENCIDO' });
  await mkPay(h2.id, 40, 'EFECTIVO', D(-40));
  let h3 = await mkMem(m.id, P['Mensual'], { start: D(-5), balance: 0, status: 'PAGADO' });
  await mkPay(h3.id, 40, 'EFECTIVO', D(-5));

  // 9. SIN MEMBRESIA
  await mkMember('Irene', 'Gomez', { phone: '0996666666' });

  // 10. INACTIVO (con una vencida)
  m = await mkMember('Javier', 'Ruiz', { active: false });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-30), balance: 0, status: 'VENCIDO' });
  await mkPay(ms.id, 40, 'EFECTIVO', D(-30));

  // 11-13. CONGELAMIENTO MASIVO (mismo batch, 8 dias, "Feriado local")
  const batch = randomUUID();
  for (const [f, l] of [['Karen', 'Molina'], ['Luis', 'Fara'], ['Marta', 'Rios']]) {
    m = await mkMember(f, l);
    ms = await mkMem(m.id, P['Mensual'], { start: D(-6), balance: 0, status: 'PAGADO', frozenDays: 8, freezeDays: 8 });
    await mkPay(ms.id, 40, 'EFECTIVO', D(-6));
    await mkFreeze(ms.id, 8, 'Feriado local', true, batch, D(-2));
  }

  // 14. CONGELAMIENTO INDIVIDUAL (5 dias, "Viaje personal")
  m = await mkMember('Nora', 'Castro', { phone: '0997777777' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-4), balance: 0, status: 'PAGADO', frozenDays: 5, freezeDays: 5 });
  await mkPay(ms.id, 40, 'EFECTIVO', D(-4));
  await mkFreeze(ms.id, 5, 'Viaje personal', false, null, D(-1));

  // 15. PROMO Black Friday, debe parcial (notificacion)
  m = await mkMember('Oscar', 'Rey', { phone: '0998888888' });
  ms = await mkMem(m.id, P['Black Friday'], { start: D(-6), balance: 30, status: 'PENDIENTE' });
  await mkPay(ms.id, 40, 'EFECTIVO', D(-6));

  // 16. AL DIA plan ANUAL (variedad de plan grande)
  m = await mkMember('Paula', 'Leon', { phone: '0990000016' });
  ms = await mkMem(m.id, P['Anual'], { start: D(-10), balance: 0, status: 'PAGADO' });
  await mkPay(ms.id, 350, 'TRANSFERENCIA', D(-10));

  // 17. QUINCENAL debe (vigente por dias) + notificacion
  m = await mkMember('Raul', 'Diaz', { phone: '0990000017' });
  ms = await mkMem(m.id, P['Quincenal'], { start: D(-9), balance: 10, status: 'PENDIENTE' });
  await mkPay(ms.id, 15, 'EFECTIVO', D(-9));

  // 18. POR VENCER en 2 dias (vigente, pagada) -> aviso cyan
  m = await mkMember('Sabrina', 'Ponce', { phone: '0990000018' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-28), end: D(2), balance: 0, status: 'PAGADO' });
  await mkPay(ms.id, 40, 'EFECTIVO', D(-3));

  // 19. POR VENCER en 4 dias (vigente, pagada)
  m = await mkMember('Tomas', 'Vargas', { phone: '0990000019' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-26), end: D(4), balance: 0, status: 'PAGADO' });
  await mkPay(ms.id, 40, 'TRANSFERENCIA', D(-4));

  // 20. POR VENCER en 3 dias Y DEBE -> aparece en los dos avisos (cyan + ambar)
  m = await mkMember('Ursula', 'Rios', { phone: '0990000020' });
  ms = await mkMem(m.id, P['Mensual'], { start: D(-27), end: D(3), balance: 15, status: 'PENDIENTE' });
  await mkPay(ms.id, 25, 'EFECTIVO', D(-27));

  const [cli, mem, pay, frz] = await Promise.all([
    prisma.member.count(),
    prisma.membership.count(),
    prisma.payment.count(),
    prisma.membershipFreeze.count(),
  ]);
  console.log(`OK -> clientes ${cli}, membresias ${mem}, pagos ${pay}, congelamientos ${frz}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
