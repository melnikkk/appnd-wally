import { Injectable } from '@nestjs/common';
import { Policy, Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { RuleService } from '../rule/rule.service';
import { AnalysisService } from '../analysis/analysis.service';

@Injectable()
export class PolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
    private readonly analysisService: AnalysisService
  ) {}

  async create(userId: string, createPolicyDto: CreatePolicyDto): Promise<Policy> {
    const { name, description, organizationId, isActive = true, rules = [] } = createPolicyDto;

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
        await this.ruleService.createMany(policy.id, rules);
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

  async evaluatePromptAgainstPolicy(policyId: string, prompt: string) {
    const policy = await this.findOne(policyId);
    
    if (!policy) {
      return { matched: false, rule: null, similarityScore: 0 };
    }
    
    const ruleEmbeddings = policy.rules.map(rule => {
      const parameters = rule.parameters as any;

      return {
        ruleId: rule.id,
        embedding: parameters.embedding || [],
        rule: rule,
      };
    });
    
    const validRuleEmbeddings = ruleEmbeddings.filter(re => re.embedding.length > 0);
    
    if (validRuleEmbeddings.length === 0) {
      return { matched: false, rule: null, similarityScore: 0 };
    }

    const { ruleId, similarityScore } = await this.analysisService.analyzePrompt(
      prompt,
      validRuleEmbeddings
    );

    const matchedRuleInfo = ruleId 
      ? ruleEmbeddings.find(re => re.ruleId === ruleId)
      : null;

    return {
      matched: similarityScore > 0.8, // TODO: Threshold should be configurable
      rule: matchedRuleInfo?.rule || null,
      similarityScore,
    };
  }
}
