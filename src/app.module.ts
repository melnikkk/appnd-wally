import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnalyticsController } from './analytics/analytics.controller';
import { NotificationsModule } from './infrastructure/notifications/notifications.module';
import { ClerkWebhooksModule } from './infrastructure/webhooks/clerk-webhooks.module';
import { PolicyModule } from './policy/policy.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from './auth/auth.module';
import { ClerkGlobalGuard } from './auth/guards/clerk-global.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    QueueModule,
    AnalyticsModule,
    NotificationsModule,
    ClerkWebhooksModule,
    PolicyModule,
    AnalysisModule,
    AuthModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkGlobalGuard,
    }
  ],
})
export class AppModule {}
