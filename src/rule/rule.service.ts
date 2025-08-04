import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { Rule, RuleType } from '@prisma/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService
  ) {}

  async create(policyId: string, createRuleDto: CreateRuleDto): Promise<Rule> {
    const { name, description, ruleType, parameters } = createRuleDto;

    const textToEmbed = this.getTextToEmbedFromParameters(ruleType, parameters);

    const embedding = await this.analysisService.generateEmbedding(textToEmbed);

    return this.prisma.rule.create({
      data: {
        name,
        description,
        ruleType,
        parameters: {
          ...parameters,
          embedding,
        },
        policy: {
          connect: { id: policyId },
        },
      },
    });
  }

  async createMany(policyId: string, createRuleDtos: CreateRuleDto[]): Promise<Rule[]> {
    const createdRules: Rule[] = [];

    for (const dto of createRuleDtos) {
      const rule = await this.create(policyId, dto);

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
    const { name, description, parameters } = updateRuleDto;
    const existingRule = await this.findOne(id);

    if (!existingRule) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    let updatedParameters = parameters;
    
    if (parameters) {
      const textToEmbed = this.getTextToEmbedFromParameters(existingRule.ruleType, parameters);
      const embedding = await this.analysisService.generateEmbedding(textToEmbed);
      
      updatedParameters = {
        ...parameters,
        embedding,
      };
    }

    return this.prisma.rule.update({
      where: { id },
      data: {
        name,
        description,
        parameters: updatedParameters,
      },
    });
  }

  /**
   * Remove a rule
   */
  async remove(id: string): Promise<void> {
    await this.prisma.rule.delete({
      where: { id },
    });
  }

  /**
   * Extract the text to embed from rule parameters based on rule type
   */
  private getTextToEmbedFromParameters(ruleType: RuleType, parameters: any): string {
    switch (ruleType) {
      case RuleType.CONTENT_FILTER:
        return parameters.contentPatterns?.join(' ') || '';
      case RuleType.PII_DETECTION:
        return parameters.piiTypes?.join(' ') || '';
      case RuleType.TOXIC_LANGUAGE:
        return parameters.toxicTerms?.join(' ') || '';
      case RuleType.PROMPT_INJECTION:
        return parameters.injectionPatterns?.join(' ') || '';
      case RuleType.CUSTOM:
        return parameters.customRule || '';
      default:
        return JSON.stringify(parameters);
    }
  }


}
