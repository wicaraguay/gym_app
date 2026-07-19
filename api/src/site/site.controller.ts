import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SiteService } from './site.service';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('site')
export class SiteController {
  constructor(private site: SiteService) {}

  // PUBLICO: contenido para la web (sin login).
  @Get('public')
  getPublic() {
    return this.site.getPublic();
  }

  // PUBLICO: formulario de contacto. Rate-limited anti-spam (3 por minuto/IP).
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('contact')
  contact(@Body() dto: CreateContactDto) {
    return this.site.createContact(dto);
  }

  // ----- Admin (solo ADMIN) -----
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch()
  update(@Body() dto: UpdateSiteDto) {
    return this.site.updateContent(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('messages')
  messages() {
    return this.site.listMessages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('messages/:id')
  markRead(@Param('id') id: string) {
    return this.site.markRead(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('messages/:id')
  remove(@Param('id') id: string) {
    return this.site.remove(id);
  }
}
