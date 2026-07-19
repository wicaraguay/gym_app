import { Module } from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';

@Module({
  providers: [SiteService],
  controllers: [SiteController],
})
export class SiteModule {}
