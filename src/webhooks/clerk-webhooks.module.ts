import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService],
  exports: [ClerkWebhooksService],
})
export class ClerkWebhooksModule {}
