import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkSessionService } from './services/clerk-session.service';
import { ClerkGlobalGuard } from './guards/clerk-global.guard';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [ClerkGlobalGuard, ClerkSessionService],
  exports: [ClerkGlobalGuard, ClerkSessionService],
})
export class AuthModule {}
