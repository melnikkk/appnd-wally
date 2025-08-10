import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { PolicyService } from './policy.service';

@Injectable()
export class PolicyEvaluationService {
  private readonly logger = new Logger(PolicyEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
  ) {}

  async evaluatePrompt(
    organizationId: string,
    prompt: string,
  ): Promise<{
    blocked: boolean;
    blockReason?: string;
    matchedRule?: string;
    matchedPolicy?: string;
    similarityScore?: number;
    ruleType?: string;
  }> {
    const evaluation = await this.policyService.findBestMatchAcrossAllPolicies(
      organizationId,
      prompt,
    );
    
    if (evaluation.matched && evaluation.rule) {
      return {
        blocked: true,
        blockReason: evaluation.rule.description || evaluation.rule.name,
        matchedRule: evaluation.rule.id,
        matchedPolicy: evaluation.policyId,
        similarityScore: evaluation.similarityScore,
        ruleType: evaluation.ruleType,
      };
    }

    return { blocked: false };
  }

  async logEvaluation(
    organizationId: string,
    userId: string,
    prompt: string,
    evaluation: {
      blocked: boolean;
      blockReason?: string;
      matchedRule?: string;
      matchedPolicy?: string;
      similarityScore?: number;
      ruleType?: string;
    },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new Error('Logging failed: User does not belong to the organization.');
    }

    await this.prisma.requestLog.create({
      data: {
        user: {
          connect: { id: userId },
        },
        policy: evaluation.matchedPolicy
          ? {
              connect: { id: evaluation.matchedPolicy },
            }
          : undefined,
        request: {
          prompt,
          timestamp: new Date().toISOString(),
        },
        response: {
          blocked: evaluation.blocked,
          blockReason: evaluation.blockReason,
          similarityScore: evaluation.similarityScore,
          ruleType: evaluation.ruleType,
        },
        blocked: evaluation.blocked,
        blockReason: evaluation.blockReason,
      },
    });
  }
}
