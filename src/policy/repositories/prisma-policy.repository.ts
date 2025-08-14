import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Policy as PrismaPolicy, Rule as PrismaRule } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AnalysisService } from '../../analysis/analysis.service';
import { RuleService } from '../../rule/rule.service';
import { Policy, Policies, PolicyMatchResult } from '../policy.types';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';
import { FindAllParams, PolicyRepository } from './policy-repository.interface';
import { RuleType } from '../../rule/rule.types';
import {
  PolicyNotFoundException,
  PolicyCreationException,
  PolicyForbiddenException,
  PolicyEvaluationException,
} from '../exceptions/policy.exceptions';

@Injectable()
export class PrismaPolicyRepository implements PolicyRepository {
  private readonly logger = new Logger(PrismaPolicyRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
    private readonly analysisService: AnalysisService,
  ) {}

  private transformPrismaPolicy(
    prismaPolicy: PrismaPolicy & { rules: Array<PrismaRule> },
  ): Policy {
    return {
      id: prismaPolicy.id,
      mode: prismaPolicy.mode as any,
      name: prismaPolicy.name,
      description: prismaPolicy.description || undefined,
      isActive: prismaPolicy.isActive,
      threshold: prismaPolicy.threshold,
      userId: prismaPolicy.userId,
      organizationId: prismaPolicy.organizationId || '',
      rules: this.ruleService.transformPrismaRules(prismaPolicy.rules),
      createdAt: prismaPolicy.createdAt,
      updatedAt: prismaPolicy.updatedAt,
    };
  }

  async verifyPolicyAccess(organizationId: string, policyId: string): Promise<boolean> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      select: { organizationId: true },
    });

    if (!policy) {
      throw new PolicyNotFoundException(policyId);
    }

    return policy?.organizationId === organizationId;
  }

  async createPolicy(
    organizationId: string,
    userId: string,
    createPolicyDto: CreatePolicyDto,
  ): Promise<Policy> {
    const { name, description, rules, isActive, mode, threshold } = createPolicyDto;

    return this.prisma.executeInTransaction(async (prisma) => {
      const policy = await prisma.policy.create({
        data: {
          mode,
          name,
          description,
          isActive,
          threshold,
          user: {
            connect: { id: userId },
          },
          organization: {
            connect: { id: organizationId },
          },
        },
      });

      if (rules.length > 0) {
        await this.ruleService.createMany(policy.id, rules, prisma);
      }

      const completePolicy = await prisma.policy.findUnique({
        where: { id: policy.id },
        include: { rules: true },
      });

      if (!completePolicy) {
        throw new PolicyCreationException(
          `Failed to fetch created policy with id ${policy.id}`,
          { policyId: policy.id },
        );
      }

      return this.transformPrismaPolicy(completePolicy);
    });
  }

  async createManyPolicies(
    userId: string,
    createPoliciesDto: Array<CreatePolicyDto>,
    organizationId?: string,
  ): Promise<Policies> {
    if (!organizationId) {
      throw new PolicyForbiddenException('Organization ID is required');
    }

    const policies: Policies = [];

    for (const createPolicyDto of createPoliciesDto) {
      const policy = await this.createPolicy(organizationId, userId, createPolicyDto);
      policies.push(policy);
    }

    return policies;
  }

  async findAllPolicies(params: FindAllParams): Promise<Policies> {
    const { userId, organizationId, isActive, skip, take } = params;

    if (!organizationId) {
      throw new PolicyForbiddenException('Organization ID is required');
    }

    const where: Prisma.PolicyWhereInput = {
      organizationId,
    };

    if (userId) {
      where.userId = userId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const policies = await this.prisma.policy.findMany({
      where,
      include: {
        rules: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return policies.map((policy) => this.transformPrismaPolicy(policy));
  }

  async findPolicyById(id: string): Promise<Policy | null> {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        rules: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!policy) {
      return null;
    }

    return this.transformPrismaPolicy(policy);
  }

  async updatePolicy(
    id: string,
    updatePolicyDto: UpdatePolicyDto,
    organizationId: string,
  ): Promise<Policy> {
    const doesPolicyBelongToOrganization = await this.verifyPolicyAccess(
      organizationId,
      id,
    );

    if (!doesPolicyBelongToOrganization) {
      throw new PolicyForbiddenException('User does not have access to this policy');
    }

    const { name, description, isActive, mode, threshold } = updatePolicyDto;

    const updatedPolicy = await this.prisma.policy.update({
      where: { id },
      data: {
        mode,
        name,
        description,
        isActive,
        threshold,
      },
      include: {
        rules: true,
      },
    });

    return this.transformPrismaPolicy(updatedPolicy);
  }

  async deletePolicy(id: string): Promise<void> {
    try {
      await this.prisma.policy.delete({
        where: { id },
      });

      this.logger.log(`Policy ${id} successfully deleted`);
    } catch (error) {
      throw new PolicyForbiddenException('Failed to delete policy');
    }
  }

  async findBestMatchForPolicy(
    policyId: string,
    prompt: string,
    organizationId: string,
  ): Promise<PolicyMatchResult> {
    try {
      const policy = await this.findPolicyById(policyId);

      if (!policy) {
        throw new PolicyNotFoundException(policyId);
      }

      for (const rule of policy.rules) {
        if (rule.type !== RuleType.KEYWORD_BLOCK) {
          continue;
        }

        const description = rule.description;

        if (description.startsWith('/') && description.match(/\/[gimuy]*$/)) {
          try {
            const pattern = description.replace(/^\/|\/[gimuy]*$/g, '');
            const flags = description.match(/\/([gimuy]*)$/)?.[1] || '';
            const regex = new RegExp(pattern, flags);

            if (regex.test(prompt)) {
              return {
                matched: true,
                rule: {
                  id: rule.id,
                  name: rule.name,
                  description: rule.description,
                },
                policyId: policy.id,
                ruleType: rule.type,
              };
            }
          } catch (error) {
            this.logger.error(
              `Invalid regex pattern in rule ${rule.id}: ${error.message}`,
            );
          }
        } else if (
          description &&
          prompt.toLowerCase().includes(description.toLowerCase())
        ) {
          return {
            matched: true,
            rule: {
              id: rule.id,
              name: rule.name,
              description: rule.description,
            },
            policyId: policy.id,
            ruleType: rule.type,
          };
        }
      }

      const promptEmbedding = await this.analysisService.generateEmbedding(prompt);
      const vector = `[${promptEmbedding.join(',')}]`;

      const result = await this.prisma.$queryRaw<
        Array<{
          ruleId: string;
          description: string;
          name: string;
          policyId: string;
          similarityScore: number;
        }>
      >(
        Prisma.sql`
          SELECT
            "Rule".id as "ruleId",
            "Rule".name,
            "Rule".description,
            "Rule".threshold,
            "Policy".id as "policyId",
            "Policy".threshold as "policyThreshold",
            1 - cosine_distance("Rule".embedding, ${vector}::vector) as "similarityScore"
          FROM "Rule"
          INNER JOIN "Policy" ON "Rule"."policyId" = "Policy".id
          WHERE "Rule"."policyId" = ${policyId}
            AND "Policy"."organizationId" = ${organizationId}
            AND "Rule"."type" = 'SEMANTIC_BLOCK'
            AND 1 - cosine_distance("Rule".embedding, ${vector}::vector) > COALESCE("Rule".threshold, "Policy".threshold, 0.55)
          ORDER BY "similarityScore" DESC
          LIMIT 1;
        `,
      );

      if (!result || result.length === 0) {
        return { matched: false };
      }

      const bestMatch = result[0];

      this.logger.debug(
        `Semantic match found in rule ${bestMatch.ruleId} with score ${bestMatch.similarityScore}`,
      );

      return {
        matched: true,
        rule: {
          id: bestMatch.ruleId,
          name: bestMatch.name,
          description: bestMatch.description,
        },
        policyId: bestMatch.policyId,
        similarityScore: bestMatch.similarityScore,
        ruleType: RuleType.SEMANTIC_BLOCK,
      };
    } catch (error) {
      throw new PolicyEvaluationException(
        `Error evaluating policy ${policyId} for organization ${organizationId}: ${error.message}`,
      );
    }
  }
}
