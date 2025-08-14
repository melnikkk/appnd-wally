import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { TextEmbeddingProvider } from '../interfaces/text-embeding-provider.interface';
import { AIProviderInternalException } from '../exceptions/provider.exceptions';

export class GeminiTextEmbeddingProvider implements TextEmbeddingProvider {
  private readonly modelName: string = 'gemini-embedding-001';
  private readonly logger = new Logger(GeminiTextEmbeddingProvider.name);

  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new AIProviderInternalException(
        'AI provider key is not defined in the configuration.',
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  async getEmbeddings(prompt: string): Promise<Array<number>> {
    try {
      const {
        embedding: { values },
      } = await this.model.embedContent(prompt);

      return values;
    } catch (error) {
      this.logger.error('Failed to get embeddings from Gemini', error);

      throw new AIProviderInternalException('Failed to get embeddings');
    }
  }
}
