import { Injectable, Logger } from '@nestjs/common';
import { Policy, Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { RuleService } from '../rule/rule.service';
import { AnalysisService } from '../analysis/analysis.service';
import { RuleType } from 'src/rule/rule.types';

const SIMILARITY_THRESHOLD = 0.75;

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
    private readonly analysisService: AnalysisService
  ) {}

  async create(userId: string, createPolicyDto: CreatePolicyDto): Promise<Policy> {
    const {
      name,
      description,
      organizationId,
      isActive,
      rules,
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
    const keywordMatch = await this.checkKeywordMatches(organizationId, prompt);

    if (keywordMatch.matched) {
      return {
        ...keywordMatch,
        ruleType: RuleType.KEYWORD_BLOCK,
      };
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
          AND "Rule"."type" = 'SEMANTIC_BLOCK'
          AND 1 - ("Rule".embedding <=> ${vector}::vector) > ${SIMILARITY_THRESHOLD}
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

  async checkKeywordMatches(
    organizationId: string,
    prompt: string,
  ): Promise<{ matched: boolean; rule?: any; policyId?: string }> {
    const rules = await this.prisma.rule.findMany({
      where: {
        type: RuleType.KEYWORD_BLOCK,
        policy: {
          organizationId: organizationId,
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        pattern: true,
        policyId: true,
      },
    });

    for (const rule of rules) {
      if (!rule.pattern) {continue;}

      try {
        if (rule.pattern.startsWith('/') && rule.pattern.lastIndexOf('/') > 0) {
          const regexParts = rule.pattern.split('/');
          const pattern = regexParts[1];
          const flags = regexParts[2] || '';

          const regex = new RegExp(pattern, flags);
          if (regex.test(prompt)) {
            this.logger.debug(
              `Found regex match for rule: ${rule.id}, pattern: ${rule.pattern}`,
            );
            return {
              matched: true,
              rule: {
                id: rule.id,
                name: rule.name,
                description: rule.description,
              },
              policyId: rule.policyId,
            };
          }
        }
        else if (prompt.toLowerCase().includes(rule.pattern.toLowerCase())) {
          this.logger.debug(
            `Found text match for rule: ${rule.id}, pattern: ${rule.pattern}`,
          );
          return {
            matched: true,
            rule: {
              id: rule.id,
              name: rule.name,
              description: rule.description,
            },
            policyId: rule.policyId,
          };
        }
      } catch (error) {
        this.logger.error(`Error evaluating keyword rule ${rule.id}: ${error.message}`);
      }
    }

    return { matched: false };
  }
}
