import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Usuario administrador por defecto (idempotente)
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@crossfit.local' },
    update: {},
    create: {
      email: 'admin@crossfit.local',
      name: 'Administrador',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // Configuracion del local (singleton)
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', businessName: 'Mi Box CrossFit' },
  });

  // Plan de ejemplo
  const plans = await prisma.plan.count();
  if (plans === 0) {
    await prisma.plan.create({
      data: { name: 'Mensual', description: 'Acceso ilimitado por 1 mes', price: 40.0, durationMonths: 1 },
    });
  }

  console.log('Seed OK -> admin@crossfit.local / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
