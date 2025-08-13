import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Policy as PrismaPolicy, Rule as PrismaRule } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { RuleService } from '../rule/rule.service';
import { AnalysisService } from '../analysis/analysis.service';
import { Policy, Policies, PolicyMode, PolicyMatchResult } from './policy.types';
import { 
  PolicyNotFoundException,
  PolicyCreationException,
} from './exceptions/policy.exceptions';
import { RuleType } from '../rule/rule.types';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
    private readonly analysisService: AnalysisService,
  ) {}

  private transformPrismaPolicy(prismaPolicy: PrismaPolicy & {rules: Array<PrismaRule>}): Policy {
    return {
      id: prismaPolicy.id,
      mode: prismaPolicy.mode as PolicyMode,
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

  async create(userId: string, createPolicyDto: CreatePolicyDto): Promise<Policy> {
    const { name, description, organizationId, rules, isActive, mode, threshold } = createPolicyDto;

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
        throw new PolicyCreationException(`Failed to fetch created policy with id ${policy.id}`, { policyId: policy.id });
      }

      return this.transformPrismaPolicy(completePolicy);
    });
  }

  async findAll(params: {
    userId?: string;
    organizationId?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Policies> {
    const { userId, organizationId, isActive, skip, take } = params;

    const where: Prisma.PolicyWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const policiesList = await this.prisma.policy.findMany({
      where,
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!policiesList.length) {
      return [];
    }

    const policyIds = policiesList.map((policy) => policy.id);

    const policies = await this.prisma.policy.findMany({
      where: {
        id: {
          in: policyIds,
        },
      },
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
    });

    const policyMap = new Map(policies.map((p) => [p.id, p]));
    const orderedPolicies = policyIds.map((id) => policyMap.get(id)).filter(Boolean) as (PrismaPolicy & {rules: Array<PrismaRule>})[];

    return orderedPolicies.map((policy) => this.transformPrismaPolicy(policy));
  }

  async findOne(id: string): Promise<Policy | null> {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
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
    });

    if (!policy) {
      return null;
    }

    return this.transformPrismaPolicy(policy);
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    const { name, description, isActive, mode, threshold } = updatePolicyDto;

    const existingPolicy = await this.findOne(id);

    if (!existingPolicy) {
      throw new PolicyNotFoundException(id);
    }

    const updatedPolicy = await this.prisma.policy.update({
      where: { id },
      data: {
        mode: mode ?? existingPolicy.mode,
        name: name ?? existingPolicy.name,
        description: description ?? existingPolicy.description,
        isActive: isActive ?? existingPolicy.isActive,
        threshold: threshold ?? existingPolicy.threshold,
      },
      include: {
        rules: true,
      },
    });

    return this.transformPrismaPolicy(updatedPolicy);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.policy.delete({
      where: { id },
    });
  }

  async findBestMatchForPolicy(
    policyId: string,
    organizationId: string,
    prompt: string,
  ): Promise<PolicyMatchResult> {
    const policy = await this.findOne(policyId);

    if (!policy) {
      return { matched: false };
    }

    if (policy.organizationId !== organizationId) {
      this.logger.warn(
        `Policy ${policyId} does not belong to organization ${organizationId}`,
      );

      return { matched: false };
    }

    for (const rule of policy.rules) {
      if (rule.type !== RuleType.KEYWORD_BLOCK) {
        continue;
      }

      const description = rule.description;

      if (
        description.startsWith('/') &&
        description.match(/\/[gimuy]*$/)
      ) {
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
          this.logger.error(`Invalid regex pattern in rule ${rule.id}: ${error.message}`);
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
  }
}
