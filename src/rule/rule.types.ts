import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RuleType {
  KEYWORD_BLOCK = 'KEYWORD_BLOCK',
  SEMANTIC_BLOCK = 'SEMANTIC_BLOCK',
}

export class Rule {
  @ApiProperty({ description: 'Unique rule identifier' })
  id: string;

  @ApiProperty({ description: 'Rule name', example: 'Password Sharing Rule' })
  name: string;

  @ApiProperty({ description: 'ID of the policy this rule belongs to' })
  policyId: string;

  @ApiProperty({ 
    description: 'Rule type that determines evaluation method',
    enum: RuleType,
    example: RuleType.KEYWORD_BLOCK
  })
  type: RuleType;

  @ApiProperty({ 
    description: 'Rule description or matching pattern',
    example: 'password sharing'
  })
  description: string;

  @ApiPropertyOptional({ 
    description: 'Custom similarity threshold for this rule',
    type: 'number',
    nullable: true,
    minimum: 0,
    maximum: 1,
    example: 0.8
  })
  threshold: number | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export type Rules = Array<Rule>;
