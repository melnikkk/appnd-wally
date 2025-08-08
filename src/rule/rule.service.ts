import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { Rule, Prisma } from '@prisma/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleType } from './rule.types';

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
    const { name, description, type, pattern } = createRuleDto;
    const client = prismaClient || this.prisma;

    const rule = await client.rule.create({
      data: {
        name,
        description,
        policy: {
          connect: { id: policyId }
        }
      }
    });
    
    const updateData: any = {
      type,
    };
    
    if (type === RuleType.KEYWORD_BLOCK && pattern) {
      updateData.pattern = pattern;
    }
    
    await client.rule.update({
      where: { id: rule.id },
      data: updateData as any
    });
    
    if (type === RuleType.SEMANTIC_BLOCK) {
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
    const { name, description, type, pattern } = updateRuleDto;

    const existingRule = await this.findOne(id);

    if (!existingRule) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    const fullRule = await this.prisma.rule.findUnique({
      where: { id }
    });
    const existingType = (fullRule as any)?.type;

    const updatedRule = await this.prisma.rule.update({
      where: { id },
      data: {
        name: name || existingRule.name,
        description: description || existingRule.description,
      }
    });
    
    const updateData: any = {};
    
    if (type) {
      updateData.type = type;
    }
    
    if (type === RuleType.KEYWORD_BLOCK) {
      let currentPattern = pattern;

      if (!currentPattern) {
        const ruleWithPattern = await this.prisma.rule.findUnique({
          where: { id }
        });

        currentPattern = (ruleWithPattern as any)?.pattern;
      }
      
      updateData.pattern = currentPattern || '';
    }
    
    if (Object.keys(updateData).length > 0) {
      await this.prisma.rule.update({
        where: { id },
        data: updateData
      });
    }

    if (type === RuleType.SEMANTIC_BLOCK && description) {
      const embeddingArray = await this.analysisService.generateEmbedding(description);
      
      if (embeddingArray && embeddingArray.length > 0) {
        await this.prisma.$executeRaw`
          UPDATE "Rule" 
          SET "embedding" = ${embeddingArray}
          WHERE "id" = ${id};
        `;
      }
    }

    if (type === RuleType.KEYWORD_BLOCK && existingType === RuleType.SEMANTIC_BLOCK) {
      await this.prisma.$executeRaw`
        UPDATE "Rule" 
        SET "embedding" = NULL
        WHERE "id" = ${id};
      `;
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
