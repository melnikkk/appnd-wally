import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RuleType, Rule } from '../../rule/rule.types';
import { RuleMatcher, RuleMatchResult } from './rule-matcher.interface';
import { AnalysisService } from '../../analysis/analysis.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class SemanticRuleMatcher implements RuleMatcher {
  private readonly logger = new Logger(SemanticRuleMatcher.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly prisma: PrismaService,
  ) {}

  canHandle(rule: Rule): boolean {
    return rule.type === RuleType.SEMANTIC_BLOCK;
  }

  async match(rule: Rule, prompt: string): Promise<RuleMatchResult> {
    try {
      const promptEmbedding = await this.analysisService.generateEmbedding(prompt);
      const vector = `[${promptEmbedding.join(',')}]`;

      const policy = await this.prisma.policy.findUnique({
        where: { id: rule.policyId },
        select: { threshold: true, organizationId: true },
      });

      if (!policy) {
        return { matched: false };
      }

      const result = await this.prisma.$queryRaw<
        Array<{
          similarityScore: number;
        }>
      >(
        Prisma.sql`
          SELECT
            1 - cosine_distance("Rule".embedding, ${vector}::vector) as "similarityScore"
          FROM "Rule"
          WHERE "Rule".id = ${rule.id}
        `,
      );

      if (!result || result.length === 0) {
        return { matched: false };
      }

      const score = result[0].similarityScore;
      const threshold = rule.threshold || policy.threshold || 0.55;

      this.logger.debug(
        `Semantic match check for rule ${rule.id}: score=${score}, threshold=${threshold}`,
      );

      if (score > threshold) {
        return {
          matched: true,
          rule: {
            id: rule.id,
            name: rule.name,
            description: rule.description,
          },
          policyId: rule.policyId,
          similarityScore: score,
          ruleType: RuleType.SEMANTIC_BLOCK,
        };
      }

      return { matched: false };
    } catch (error) {
      this.logger.error(
        `Error in semantic matching for rule ${rule.id}: ${error.message}`,
        error.stack,
      );

      return { matched: false };
    }
  }
}
