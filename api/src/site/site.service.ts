import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateContactDto } from './dto/create-contact.dto';

const SITE_ID = 'singleton';
const SETTINGS_ID = 'singleton';

@Injectable()
export class SiteService {
  constructor(private prisma: PrismaService) {}

  private content() {
    return this.prisma.siteContent.upsert({
      where: { id: SITE_ID },
      update: {},
      create: { id: SITE_ID },
    });
  }

  // Todo lo que la web publica necesita, sin autenticar: marca del negocio,
  // contenido editable y los planes activos.
  async getPublic() {
    const [settings, content, plans] = await Promise.all([
      this.prisma.settings.upsert({
        where: { id: SETTINGS_ID },
        update: {},
        create: { id: SETTINGS_ID },
      }),
      this.content(),
      this.prisma.plan.findMany({
        where: { active: true },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          durationMonths: true,
          durationDays: true,
        },
      }),
    ]);
    return {
      branding: {
        businessName: settings.businessName,
        logoUrl: settings.logoUrl,
        photoUrl: settings.photoUrl,
        address: settings.address,
        accentColor: settings.accentColor,
        whatsapp: settings.whatsapp,
      },
      content,
      plans: plans.map((p) => ({ ...p, price: Number(p.price) })),
    };
  }

  getContent() {
    return this.content();
  }

  async updateContent(dto: UpdateSiteDto) {
    await this.content();
    return this.prisma.siteContent.update({
      where: { id: SITE_ID },
      data: dto as Prisma.SiteContentUpdateInput,
    });
  }

  createContact(dto: CreateContactDto) {
    return this.prisma.contactMessage.create({ data: dto });
  }

  listMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async markRead(id: string) {
    await this.getOr404(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }

  async remove(id: string) {
    await this.getOr404(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async getOr404(id: string) {
    const m = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Mensaje no encontrado');
    return m;
  }
}
