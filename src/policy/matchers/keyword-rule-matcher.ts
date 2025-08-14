import { Injectable, Logger } from '@nestjs/common';
import { Rule } from '../../rule/rule.types';
import { RuleType } from '../../rule/rule.types';
import { RuleMatcher, RuleMatchResult } from './rule-matcher.interface';

@Injectable()
export class KeywordRuleMatcher implements RuleMatcher {
  private readonly logger = new Logger(KeywordRuleMatcher.name);

  canHandle(rule: Rule): boolean {
    return rule.type === RuleType.KEYWORD_BLOCK;
  }

  async match(rule: Rule, prompt: string): Promise<RuleMatchResult> {
    const description = rule.description;

    if (description.startsWith('/') && description.match(/\/[gimuy]*$/)) {
      try {
        const pattern = description.replace(/^\/|\/[gimuy]*$/g, '');
        const flags = description.match(/\/([gimuy]*)$/)?.[1] || '';
        const regex = new RegExp(pattern, flags);

        if (regex.test(prompt)) {
          return this.createMatchResult(true, rule);
        }
      } catch (error) {
        this.logger.error(`Invalid regex pattern in rule ${rule.id}: ${error.message}`);
      }
    } else if (description && prompt.toLowerCase().includes(description.toLowerCase())) {
      return this.createMatchResult(true, rule);
    }

    return { matched: false };
  }

  private createMatchResult(matched: boolean, rule: Rule): RuleMatchResult {
    if (!matched) {
      return { matched: false };
    }

    return {
      matched: true,
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
      },
      policyId: rule.policyId,
      ruleType: rule.type,
    };
  }
}
