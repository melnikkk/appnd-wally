import type { Rules } from '../rule/rule.types';
import { RuleType } from '../rule/rule.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PolicyMode {
  BLOCKLIST = 'BLOCKLIST',
  ALLOWLIST = 'ALLOWLIST',
}

export class Policy {
  @ApiProperty({ description: 'Unique policy identifier' })
  id: string;

  @ApiProperty({ 
    description: 'Policy mode that defines how rules are evaluated',
    enum: PolicyMode,
    example: PolicyMode.BLOCKLIST
  })
  mode: PolicyMode;

  @ApiProperty({ description: 'Policy name', example: 'Security Content Policy' })
  name: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  description?: string;

  @ApiProperty({ description: 'Whether policy is active', example: true })
  isActive: boolean;

  @ApiProperty({ 
    description: 'Default similarity threshold for semantic matching', 
    example: 0.7,
    minimum: 0,
    maximum: 1
  })
  threshold: number;

  @ApiProperty({ description: 'ID of user who created this policy' })
  userId: string;

  @ApiProperty({ description: 'ID of organization this policy belongs to' })
  organizationId: string;

  @ApiProperty({ 
    description: 'Rules associated with this policy',
    type: 'array',
    items: {
      $ref: '#/components/schemas/Rule'
    }
  })
  rules: Rules; 

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export type Policies = Array<Policy>;

export class PolicyMatchResult {
  @ApiProperty({ description: 'Whether a matching rule was found', example: true })
  matched: boolean;

  @ApiPropertyOptional({
    description: 'Information about the matched rule if any',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Rule ID' },
      name: { type: 'string', description: 'Rule name' },
      description: { type: 'string', description: 'Rule description' }
    }
  })
  rule?: {
    id: string;
    name: string;
    description: string;
  };

  @ApiPropertyOptional({ description: 'ID of the matched policy' })
  policyId?: string;

  @ApiPropertyOptional({ 
    description: 'Similarity score for semantic matches',
    type: 'number',
    minimum: 0,
    maximum: 1,
    example: 0.85
  })
  similarityScore?: number;

  @ApiPropertyOptional({ 
    description: 'Type of the matched rule',
    example: 'SEMANTIC_BLOCK'
  })
  ruleType?: string;
}

export class PolicyEvaluationResult {
  @ApiProperty({ 
    description: 'Whether the content should be blocked', 
    example: false 
  })
  blocked: boolean;

  @ApiPropertyOptional({ 
    description: 'Reason for blocking if content is blocked',
    example: 'Content matched with dangerous topics policy'
  })
  blockReason?: string;

  @ApiPropertyOptional({ description: 'ID of the matched rule if any' })
  matchedRule?: string;

  @ApiPropertyOptional({ description: 'ID of the matched policy if any' })
  matchedPolicy?: string;

  @ApiPropertyOptional({ 
    description: 'Similarity score for semantic matches',
    type: 'number',
    minimum: 0,
    maximum: 1,
    example: 0.78
  })
  similarityScore?: number;

  @ApiPropertyOptional({ 
    description: 'Type of rule that triggered the match',
    enum: RuleType
  })
  ruleType?: RuleType;
}
