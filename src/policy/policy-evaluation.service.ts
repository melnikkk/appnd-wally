import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { PolicyService } from './policy.service';

@Injectable()
export class PolicyEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService
  ) {}

  async evaluatePrompt(organizationId: string, prompt: string): Promise<{
    blocked: boolean;
    blockReason?: string;
    matchedRule?: string;
    matchedPolicy?: string;
    similarityScore?: number;
  }> {
    const policies = await this.prisma.policy.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    if (!policies || policies.length === 0) {
      return { blocked: false };
    }

    for (const policy of policies) {
      const evaluation = await this.policyService.evaluatePromptAgainstPolicy(policy.id, prompt);
      
      if (evaluation.matched && evaluation.rule) {
        // If any policy/rule match is found and blocks the prompt
        return {
          blocked: true,
          blockReason: evaluation.rule.description || evaluation.rule.name,
          matchedRule: evaluation.rule.id,
          matchedPolicy: policy.id,
          similarityScore: evaluation.similarityScore
        };
      }
    }

    // No blocking policies found
    return { blocked: false };
  }

  /**
   * Log a prompt evaluation result
   */
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
    }
  ) {
    // Create a request log entry
    await this.prisma.requestLog.create({
      data: {
        user: {
          connect: { id: userId }
        },
        policy: evaluation.matchedPolicy ? {
          connect: { id: evaluation.matchedPolicy }
        } : undefined,
        request: {
          prompt,
          timestamp: new Date().toISOString()
        },
        response: {
          blocked: evaluation.blocked,
          blockReason: evaluation.blockReason,
          similarityScore: evaluation.similarityScore
        },
        blocked: evaluation.blocked,
        blockReason: evaluation.blockReason
      }
    });
  }
}
