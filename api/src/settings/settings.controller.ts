import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Sin guard a nivel de clase: la marca publica NO requiere login.
// Las rutas sensibles aplican sus propios guards por metodo.
@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  // PUBLICO: solo nombre + logo, para el login (sin autenticar).
  @Get('public')
  getPublic() {
    return this.settings.getBranding();
  }

  // Config completa (incluye datos sensibles): requiere estar logueado.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  get() {
    return this.settings.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
