import { Injectable } from '@nestjs/common';
import { Policy, Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { RuleService } from '../rule/rule.service';
import { AnalysisService } from '../analysis/analysis.service';

const SIMILARITY_THRESHOLD = 0.75;

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

  async evaluatePromptAgainstPolicy(
    policyId: string,
    organizationId: string,
    prompt: string,
  ): Promise<{ matched: boolean; rule?: any; similarityScore?: number }> {
    const promptEmbedding = await this.analysisService.generateEmbedding(prompt);

    const similarRule = await this.ruleService.findMostSimilar(
      promptEmbedding,
      policyId,
      organizationId,
    );

    if (similarRule) {
      if (similarRule.similarityScore > SIMILARITY_THRESHOLD) {
        const ruleDetails = await this.ruleService.findOne(similarRule.ruleId);
        
        return {
          matched: true,
          rule: ruleDetails,
          similarityScore: similarRule.similarityScore,
        };
      }
    }

    return { matched: false };
  }
}
