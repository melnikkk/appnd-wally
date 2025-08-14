import { ConfigService } from '@nestjs/config';
import { TextEmbeddingProvider } from '../interfaces/text-embeding-provider.interface';
import { GeminiTextEmbeddingProvider } from './gemeni-text-embeddings.provider';
import { InternalServerErrorException } from '../../common/exceptions/common.exceptions';

export const textEmbeddingProviderFactory = {
  provide: 'TextEmbeddingProvider',
  useFactory: (configService: ConfigService): TextEmbeddingProvider => {
    const providerType = configService.get<string>('EMBEDDING_PROVIDER');

    switch (providerType) {
      case 'gemini':
        return new GeminiTextEmbeddingProvider(configService);
      default:
        throw new InternalServerErrorException(
          `Invalid or missing EMBEDDING_PROVIDER: ${providerType}`,
        );
    }
  },
  inject: [ConfigService],
};
