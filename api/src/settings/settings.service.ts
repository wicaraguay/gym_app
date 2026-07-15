import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export const SETTINGS_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  get() {
    return this.prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  // Marca publica para pantallas SIN autenticar (ej. el login).
  // Devuelve SOLO lo no sensible: nombre y logo. NUNCA ruc, direccion, dueno.
  async getBranding() {
    const s = await this.get();
    return { businessName: s.businessName, logoUrl: s.logoUrl };
  }

  async update(dto: UpdateSettingsDto) {
    await this.prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
    return this.prisma.settings.update({
      where: { id: SETTINGS_ID },
      data: dto,
    });
  }
}
