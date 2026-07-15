/* eslint-disable */
// Borra TODA la data de demo (clientes, membresias, pagos, congelamientos),
// los planes creados por el seed y el usuario "Recep Suplente".
// NO toca los usuarios reales (admin / recepcionistas).
// Correr:  docker compose exec -T api node prisma/seed-demo-clear.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_PLANS = [
  'Mensual',
  'Trimestral',
  'Black Friday',
  'Anual',
  'Quincenal',
  'Semana de prueba',
];

async function main() {
  await prisma.payment.deleteMany({});
  await prisma.membershipFreeze.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.plan.deleteMany({ where: { name: { in: DEMO_PLANS } } });
  await prisma.user.deleteMany({ where: { email: 'suplente@crossfit.local' } });

  const [cli, pln] = await Promise.all([
    prisma.member.count(),
    prisma.plan.count(),
  ]);
  console.log(`Demo borrada. Quedan: clientes ${cli}, planes ${pln}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
