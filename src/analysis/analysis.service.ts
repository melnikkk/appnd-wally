import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalysisService {
  async generateEmbedding(_text: string): Promise<number[]> {
    return Array.from({ length: 1536 }, () => Math.random());
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    const dotProduct = embedding1.reduce(
      (sum, value, i) => sum + value * embedding2[i],
      0,
    );

    const magnitude1 = Math.sqrt(
      embedding1.reduce((sum, value) => sum + value * value, 0),
    );
    const magnitude2 = Math.sqrt(
      embedding2.reduce((sum, value) => sum + value * value, 0),
    );

    return dotProduct / (magnitude1 * magnitude2);
  }

  async analyzePrompt(
    prompt: string,
    ruleEmbeddings: { ruleId: string; embedding: number[] }[],
  ) {
    let highestSimilarity = 0;
    let mostSimilarRuleId: string | null = null;

    const promptEmbedding = await this.generateEmbedding(prompt);

    for (const ruleEmb of ruleEmbeddings) {
      const similarity = this.calculateSimilarity(promptEmbedding, ruleEmb.embedding);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarRuleId = ruleEmb.ruleId;
      }
    }

    return {
      ruleId: mostSimilarRuleId,
      similarityScore: highestSimilarity,
    };
  }
}
