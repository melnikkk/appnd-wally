import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [PrismaModule, ConfigModule, UserModule],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService],
  exports: [ClerkWebhooksService],
})
export class ClerkWebhooksModule {}
