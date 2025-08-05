import { Inject, Injectable } from '@nestjs/common';
import type { TextEmbeddingProvider } from './interfaces/text-embeding-provider.interface';

@Injectable()
export class AnalysisService {
  constructor(
    @Inject('TextEmbeddingProvider')
    private readonly embeddingProvider: TextEmbeddingProvider,
  ) {}

  async generateEmbedding(text: string): Promise<Array<number>> {
    console.log('Generating embedding for text:', text);
    
    if (!text || text.trim().length === 0) {
      return [];
    }

    return this.embeddingProvider.getEmbeddings(text);
  }
}
