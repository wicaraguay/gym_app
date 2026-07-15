import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: dto });
  }

  findAll() {
    return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    // Nota: cambiar el precio NO afecta membresias ya creadas,
    // porque cada una guarda su priceSnapshot congelado.
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  // Delete REAL: solo si ningun cliente uso el plan (sin membresias asociadas).
  async remove(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    const count = await this.prisma.membership.count({
      where: { planId: id },
    });
    if (count > 0) {
      throw new BadRequestException(
        'No se puede eliminar: el plan tiene membresias asociadas. Desactivalo en su lugar.',
      );
    }
    await this.prisma.plan.delete({ where: { id } });
    return { deleted: true, id };
  }
}
