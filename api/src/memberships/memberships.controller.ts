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
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { FreezeMembershipDto } from './dto/freeze-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private memberships: MembershipsService) {}

  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.memberships.create(dto);
  }

  // Congelamiento masivo (solo ADMIN)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('freeze-all')
  freezeAll(
    @Body() dto: FreezeMembershipDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.memberships.freezeAll(dto, user.id);
  }

  @Post(':id/freeze')
  freeze(
    @Param('id') id: string,
    @Body() dto: FreezeMembershipDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.memberships.freeze(id, dto, user.id);
  }

  // Cancelar un congelamiento individual
  @Delete('freezes/:id')
  cancelFreeze(@Param('id') id: string) {
    return this.memberships.cancelFreeze(id);
  }

  // Historial de congelamientos masivos activos (solo ADMIN)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('freeze-batches')
  listBatches() {
    return this.memberships.listBatches();
  }

  // Revertir un congelamiento masivo completo (solo ADMIN)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('freeze-batch/:batchId')
  cancelBatch(@Param('batchId') batchId: string) {
    return this.memberships.cancelBatch(batchId);
  }

  // Editar una membresia creada por error (solo ADMIN)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.memberships.update(id, dto);
  }

  // Borrar una membresia creada por error (solo ADMIN)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberships.remove(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberships.findOne(id);
  }
}
