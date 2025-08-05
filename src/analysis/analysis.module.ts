import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { textEmbeddingProviderFactory } from './providers/text-embeddings.strategy';

@Module({
  imports: [PrismaModule],
  providers: [AnalysisService, textEmbeddingProviderFactory],
  exports: [AnalysisService],
})
export class AnalysisModule {}
