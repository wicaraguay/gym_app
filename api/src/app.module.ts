import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MembersModule } from './members/members.module';
import { PlansModule } from './plans/plans.module';
import { MembershipsModule } from './memberships/memberships.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SiteModule } from './site/site.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 10 intentos por minuto. Se aplica de forma dirigida al
    // login (ver AuthController) para frenar fuerza bruta sin molestar el uso
    // normal del panel, que puede hacer muchas requests por minuto.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    MembersModule,
    PlansModule,
    MembershipsModule,
    PaymentsModule,
    SettingsModule,
    DashboardModule,
    SiteModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
