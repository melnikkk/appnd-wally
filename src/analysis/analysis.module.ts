import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
