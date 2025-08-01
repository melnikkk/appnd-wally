import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analytics',
    }),
    PrismaModule,
  ],
  providers: [AnalyticsProcessor, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
