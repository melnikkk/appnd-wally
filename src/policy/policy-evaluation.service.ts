import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { PolicyService } from './policy.service';
import { PolicyMode, Policies } from './policy.types';
import { PolicyForbiddenException } from './exceptions/policy.exceptions';
import { BadRequestException } from '../common/exceptions/common.exceptions';

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
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const policies = await this.policyService.findAll({
      organizationId,
      isActive: true,
    });

    const [allowlistPolicies, blocklistPolicies] = policies.reduce<[Policies, Policies]>(
      (acc, policy) => {
        if (policy.mode === PolicyMode.ALLOWLIST) {
          acc[0].push(policy);
        } else if (policy.mode === PolicyMode.BLOCKLIST) {
          acc[1].push(policy);
        }
        return acc;
      },
      [[], []],
    );

    if (allowlistPolicies.length > 0) {
      const allowlistResult = await this.evaluateAllowlistPolicies(
        allowlistPolicies,
        prompt,
        organizationId,
      );

      if (allowlistResult.blocked) {
        return allowlistResult;
      }
    }

    if (blocklistPolicies.length > 0) {
      return await this.evaluateBlocklistPolicies(
        blocklistPolicies,
        prompt,
        organizationId,
      );
    }

    return { blocked: false };
  }

  // If ANY rule matches, the prompt is allowed
  // If NO rules match, the prompt is blocked
  private async evaluateAllowlistPolicies(
    policies: any[],
    prompt: string,
    organizationId: string,
  ): Promise<{
    blocked: boolean;
    blockReason?: string;
    matchedRule?: string;
    matchedPolicy?: string;
    similarityScore?: number;
    ruleType?: string;
  }> {
    for (const policy of policies) {
      const evaluation = await this.policyService.findBestMatchForPolicy(
        policy.id,
        prompt,
        organizationId,
      );

      if (evaluation.matched) {
        return { blocked: false };
      }
    }

    return {
      blocked: true,
      blockReason: 'Content is not on the approved list of topics',
      matchedPolicy: policies[0]?.id,
    };
  }

  // If ANY rule matches, the prompt is blocked
  private async evaluateBlocklistPolicies(
    policies: any[],
    prompt: string,
    organizationId: string,
  ): Promise<{
    blocked: boolean;
    blockReason?: string;
    matchedRule?: string;
    matchedPolicy?: string;
    similarityScore?: number;
    ruleType?: string;
  }> {
    for (const policy of policies) {
      const evaluation = await this.policyService.findBestMatchForPolicy(
        policy.id,
        prompt,
        organizationId,
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
  ): Promise<void> {
    if (!organizationId) {
      throw new PolicyForbiddenException(
        'Organization ID is required for logging evaluations',
      );
    }

    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, organizationId },
      });

      if (!user) {
        throw new PolicyForbiddenException('User does not belong to the organization');
      }

      if (evaluation.matchedPolicy) {
        const policy = await this.prisma.policy.findUnique({
          where: { id: evaluation.matchedPolicy },
          select: { organizationId: true },
        });

        if (policy?.organizationId !== organizationId) {
          throw new PolicyForbiddenException(
            'Policy does not belong to the organization',
          );
        }
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
    } catch (error) {
      this.logger.error(`Failed to log evaluation: ${error.message}`);

      throw error;
    }
  }
}
