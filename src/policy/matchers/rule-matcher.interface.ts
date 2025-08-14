import { Rule } from '../../rule/rule.types';

export interface RuleMatchResult {
  matched: boolean;
  rule?: {
    id: string;
    name: string;
    description: string;
  };
  policyId?: string;
  similarityScore?: number;
  ruleType?: string;
}

export interface RuleMatcher {
  canHandle(rule: Rule): boolean;
  match(rule: Rule, prompt: string): Promise<RuleMatchResult>;
}
