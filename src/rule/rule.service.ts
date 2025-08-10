import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { Rule, Prisma } from '@prisma/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleType } from './rule.types';

const SIMILARITY_THRESHOLD = 0.55;

@Injectable()
export class RuleService {
  private readonly logger = new Logger(RuleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
  ) {}

  async create(
    policyId: string,
    createRuleDto: CreateRuleDto,
    prismaClient?: any,
  ): Promise<Rule> {
    const { name, description, type } = createRuleDto;
    const client = prismaClient || this.prisma;

    const rule = await client.rule.create({
      data: {
        name,
        description,
        type,
        policy: {
          connect: { id: policyId },
        },
      },
    });

    if (type === RuleType.SEMANTIC_BLOCK && description) {
      const embeddingArray = await this.analysisService.generateEmbedding(description);

      if (embeddingArray && embeddingArray.length > 0) {
        await client.$executeRaw`
          UPDATE "Rule" 
          SET "embedding" = ${embeddingArray}
          WHERE "id" = ${rule.id};
        `;
      }
    }

    return rule;
  }

  async createMany(
    policyId: string,
    createRuleDtos: CreateRuleDto[],
    prismaClient?: any,
  ): Promise<Rule[]> {
    const createdRules: Rule[] = [];

    for (const dto of createRuleDtos) {
      const rule = await this.create(policyId, dto, prismaClient);

      createdRules.push(rule);
    }

    return createdRules;
  }

  async findAllByPolicyId(policyId: string): Promise<Array<Rule>> {
    return this.prisma.rule.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByType(
    type: RuleType,
    organizationId: string,
  ): Promise<Array<Rule & { policy: { id: string } }>> {
    const rules = await this.prisma.rule.findMany({
      where: {
        type,
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

    return rules;
  }

  async findOne(id: string): Promise<Rule | null> {
    return this.prisma.rule.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    const { name, description, type } = updateRuleDto;

    const existingRule = await this.findOne(id);

    if (!existingRule) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    const updateData: any = {
      type,
      name: name || existingRule.name,
      description: description || existingRule.description,
    };

    const updatedRule = await this.prisma.rule.update({
      where: { id },
      data: updateData,
    });

    const shouldUpdateEmbedding =
      (type === RuleType.SEMANTIC_BLOCK ||
        (existingRule.type === RuleType.SEMANTIC_BLOCK && !type)) &&
      description;

    if (shouldUpdateEmbedding) {
      const embeddingArray = await this.analysisService.generateEmbedding(description);

      if (embeddingArray.length > 0) {
        await this.prisma.$executeRaw`
          UPDATE "Rule" 
          SET "embedding" = ${embeddingArray}
          WHERE "id" = ${id};
        `;
      }
    }

    return updatedRule;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.rule.delete({
      where: { id },
    });
  }

  async findMostSimilar(
    embedding: number[],
    policyId: string,
    organizationId: string,
  ): Promise<{ ruleId: string; similarityScore: number } | null> {
    const vector = `[${embedding.join(',')}]`;

    const result = await this.prisma.$queryRaw<Array<{ id: string; distance: number }>>(
      Prisma.sql`
        SELECT
          "Rule".id,
          "Rule".embedding <=> ${vector}::vector as distance
        FROM "Rule"
        INNER JOIN "Policy" ON "Rule"."policyId" = "Policy"."id"
        WHERE "Rule"."policyId" = ${policyId}
          AND "Policy"."organizationId" = ${organizationId}
        ORDER BY distance ASC
        LIMIT 1;
      `,
    );

    this.logger.log(`Most similar rule found: ${JSON.stringify(result)}`);

    if (!result || result.length === 0) {
      return null;
    }

    const mostSimilarRule = result[0];

    return {
      ruleId: mostSimilarRule.id,
      // Convert distance to similarity score (0 to 1)
      similarityScore: 1 - mostSimilarRule.distance,
    };
  }

  async evaluateSemanticBlockRule(
    vector: string,
    organizationId: string,
  ): Promise<{
    matched: boolean;
    rule?: any;
    policyId?: string;
    similarityScore?: number;
    ruleType?: string;
  }> {
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
          1 - ("Rule".embedding <=> ${vector}::vector) as "similarityScore"
        FROM "Rule"
        INNER JOIN "Policy" ON "Rule"."policyId" = "Policy".id
        WHERE "Policy"."organizationId" = ${organizationId}
          AND "Policy"."isActive" = TRUE
          AND "Rule"."type" = '${RuleType.SEMANTIC_BLOCK}'
          AND 1 - ("Rule".embedding <=> ${vector}::vector) > COALESCE("Rule".threshold, "Policy".threshold, ${SIMILARITY_THRESHOLD})
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

  async evaluateKeywordBlockRule(organizationId: string, prompt: string) {
    const keywordRules = await this.findAllByType(RuleType.KEYWORD_BLOCK, organizationId);

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
        this.logger.debug(`Keyword rule string match: ${rule.id}`);

        return {
          matched: true,
          rule: {
            id: rule.id,
            name: rule.name,
            description: rule.description,
          },
          policyId: rule.policy.id,
          ruleType: rule.type,
        };
      }
    }

    return { matched: false };
  }
}
