import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Campos seguros: NUNCA devolvemos el passwordHash al frontend.
const SAFE = {
  id: true,
  name: true,
  email: true,
  cedula: true,
  address: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: SAFE,
    });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
      select: SAFE,
    });
  }

  async update(id: string, dto: UpdateUserDto, actingUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    // Proteccion: no podes desactivarte a vos mismo (evita quedar sin acceso).
    if (dto.active === false && id === actingUserId) {
      throw new BadRequestException('No podes desactivar tu propia cuenta.');
    }
    // Si cambia el email, que no lo tenga otro usuario.
    if (dto.email && dto.email !== user.email) {
      const other = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (other && other.id !== id) {
        throw new BadRequestException('Ese email ya esta en uso por otra cuenta');
      }
    }
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.cedula !== undefined) data.cedula = dto.cedula;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({ where: { id }, data, select: SAFE });
  }

  async remove(id: string, actingUserId: string) {
    if (id === actingUserId) {
      throw new BadRequestException('No podes eliminar tu propia cuenta.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    // Proteccion: nunca dejes al sistema sin ningun administrador.
    if (user.role === 'ADMIN') {
      const admins = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      if (admins <= 1) {
        throw new BadRequestException(
          'No podes eliminar al unico administrador del sistema.',
        );
      }
    }
    // Los pagos guardan QUIEN los registro (auditoria del dinero). Si esta
    // persona ya cobro, eliminarla romperia ese historial: se desactiva.
    if (user._count.payments > 0) {
      throw new BadRequestException(
        `${user.name} registro ${user._count.payments} pago(s): eliminarlo romperia el historial de cobros. Desactivalo en su lugar.`,
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- Self-service: el usuario edita SU propio perfil ----

  getProfile(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: SAFE });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    // Si cambia el email, verificar que no lo tenga otro usuario.
    if (dto.email) {
      const other = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (other && other.id !== id) {
        throw new BadRequestException('Ese email ya esta en uso por otra cuenta');
      }
    }
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.cedula !== undefined) data.cedula = dto.cedula;
    if (dto.address !== undefined) data.address = dto.address;
    return this.prisma.user.update({ where: { id }, data, select: SAFE });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    // Verificar la contrasena ACTUAL antes de cambiarla (seguridad).
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('La contrasena actual no es correcta');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { changed: true };
  }
}
