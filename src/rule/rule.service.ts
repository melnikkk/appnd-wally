import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { Rule, Prisma } from '@prisma/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

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
    prismaClient?: any
  ): Promise<Rule> {
    const { name, description } = createRuleDto;
    const client = prismaClient || this.prisma;

    // First create the rule without the embedding
    const rule = await client.rule.create({
      data: {
        name,
        description,
        policy: {
          connect: { id: policyId }
        }
      }
    });
    
    // Then generate and update the embedding separately
    const embeddingArray = await this.analysisService.generateEmbedding(description || name);
    this.logger.debug(`Generated embedding for rule with dimensions: ${embeddingArray.length}`);
    
    if (embeddingArray && embeddingArray.length > 0) {
      await client.$executeRaw`
        UPDATE "Rule" 
        SET "embedding" = ${embeddingArray}
        WHERE "id" = ${rule.id};
      `;
    }
    
    return rule;
  }

  async createMany(
    policyId: string, 
    createRuleDtos: CreateRuleDto[], 
    prismaClient?: any
  ): Promise<Rule[]> {
    const createdRules: Rule[] = [];

    for (const dto of createRuleDtos) {
      const rule = await this.create(policyId, dto, prismaClient);

      createdRules.push(rule);
    }

    return createdRules;
  }

  async findAllByPolicyId(policyId: string): Promise<Rule[]> {
    return this.prisma.rule.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Rule | null> {
    return this.prisma.rule.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    const { name, description } = updateRuleDto;

    const existingRule = await this.findOne(id);

    if (!existingRule) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    // First update the basic properties
    const updatedRule = await this.prisma.rule.update({
      where: { id },
      data: {
        name: name || existingRule.name,
        description: description || existingRule.description,
      }
    });
    
    // Then update the embedding if we have a new description
    if (description) {
      const embeddingArray = await this.analysisService.generateEmbedding(description);
      this.logger.debug(`Generated embedding for rule update with dimensions: ${embeddingArray?.length || 0}`);
      
      if (embeddingArray && embeddingArray.length > 0) {
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
}
