import { Injectable, Logger } from '@nestjs/common';
import { Policy, Prisma, RuleType } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { RuleService } from '../rule/rule.service';
import { AnalysisService } from '../analysis/analysis.service';

const SIMILARITY_THRESHOLD = 0.55;

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
    private readonly analysisService: AnalysisService,
  ) {}

  async create(userId: string, createPolicyDto: CreatePolicyDto): Promise<Policy> {
    const {
      name,
      description,
      organizationId,
      rules,
      isActive,
    } = createPolicyDto;

    return this.prisma.executeInTransaction(async (prisma) => {
      const policy = await prisma.policy.create({
        data: {
          name,
          description,
          isActive,
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

      return policy;
    });
  }

  async findAll(params: {
    userId?: string;
    organizationId?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
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

    const policies = await this.prisma.policy.findMany({
      where,
      include: {
        rules: true,
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

    return policies;
  }

  async findOne(id: string) {
    return this.prisma.policy.findUnique({
      where: { id },
      include: {
        rules: true,
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
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    const { name, description, isActive } = updatePolicyDto;

    return this.prisma.policy.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.policy.delete({
      where: { id },
    });
  }

  async findBestMatchAcrossAllPolicies(
    organizationId: string,
    prompt: string,
  ): Promise<{
    matched: boolean;
    rule?: any;
    policyId?: string;
    similarityScore?: number;
    ruleType?: string;
  }> {
    const keywordRules = await this.prisma.rule.findMany({
      where: {
        type: RuleType.KEYWORD_BLOCK,
        policy: {
          organizationId,
          isActive: true,
        },
      },
      include: {
        policy: {
          select: {
            id: true,
          },
        },
      },
    });

    for (const rule of keywordRules) {
      const description = rule.description || '';

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
              policyId: rule.policy.id,
              ruleType: RuleType.KEYWORD_BLOCK,
            };
          }
        } catch (error) {
          this.logger.error(`Invalid regex pattern in rule ${rule.id}: ${error.message}`);
        }
      } else if (
        description &&
        prompt.toLowerCase().includes(description.toLowerCase())
      ) {
        this.logger.debug(`Keyword rule string match: ${rule.id}`);

        return {
          matched: true,
          rule: {
            id: rule.id,
            name: rule.name,
            description: rule.description,
          },
          policyId: rule.policy.id,
          ruleType: RuleType.KEYWORD_BLOCK,
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
          "Policy".id as "policyId",
          1 - ("Rule".embedding <=> ${vector}::vector) as "similarityScore"
        FROM "Rule"
        INNER JOIN "Policy" ON "Rule"."policyId" = "Policy".id
        WHERE "Policy"."organizationId" = ${organizationId}
          AND "Policy"."isActive" = TRUE
          AND "Rule"."type" = '${RuleType.SEMANTIC_BLOCK}'
          AND 1 - ("Rule".embedding <=> ${vector}::vector) > ${SIMILARITY_THRESHOLD}
        ORDER BY "similarityScore" DESC
        LIMIT 1;
      `,
    );

    this.logger.debug(`Best match across all policies: ${JSON.stringify(result)}`);

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
