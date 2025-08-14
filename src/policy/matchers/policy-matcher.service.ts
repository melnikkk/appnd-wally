import { Injectable, Logger, Inject } from '@nestjs/common';
import { Policy, PolicyMatchResult } from '../policy.types';
import { RuleMatcher } from './rule-matcher.interface';
import {
  PolicyNotFoundException,
  PolicyEvaluationException,
} from '../exceptions/policy.exceptions';

@Injectable()
export class PolicyMatcherService {
  private readonly logger = new Logger(PolicyMatcherService.name);

  constructor(
    @Inject('RULE_MATCHERS')
    private readonly ruleMatchers: Array<RuleMatcher>,
  ) {}

  async findBestMatchForPolicy(
    policy: Policy,
    prompt: string,
  ): Promise<PolicyMatchResult> {
    try {
      if (!policy) {
        throw new PolicyNotFoundException('Policy not found');
      }

      for (const rule of policy.rules) {
        const matcher = this.ruleMatchers.find((matcher) => matcher.canHandle(rule));

        if (!matcher) {
          this.logger.warn(`No matcher found for rule type: ${rule.type}`);

          continue;
        }

        const matchResult = await matcher.match(rule, prompt);

        if (matchResult.matched) {
          return {
            matched: true,
            rule: matchResult.rule,
            policyId: policy.id,
            similarityScore: matchResult.similarityScore,
            ruleType: matchResult.ruleType,
          };
        }
      }

      return { matched: false };
    } catch (error) {
      throw new PolicyEvaluationException(
        `Error evaluating policy ${policy.id}: ${error.message}`,
      );
    }
  }
}
