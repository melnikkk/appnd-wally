import { IsString, IsOptional, IsEnum, IsObject, ValidateIf } from 'class-validator';
import { RuleType } from '@prisma/client';

export class CreateRuleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RuleType)
  ruleType: RuleType;

  @IsObject()
  parameters: Record<string, any>;

  // Content filter parameters
  @ValidateIf(o => o.ruleType === RuleType.CONTENT_FILTER)
  @IsString({ each: true })
  @IsOptional()
  contentPatterns?: string[];

  // PII detection parameters
  @ValidateIf(o => o.ruleType === RuleType.PII_DETECTION)
  @IsString({ each: true })
  @IsOptional()
  piiTypes?: string[];

  // Toxic language parameters
  @ValidateIf(o => o.ruleType === RuleType.TOXIC_LANGUAGE)
  @IsString({ each: true })
  @IsOptional()
  toxicTerms?: string[];

  // Prompt injection parameters
  @ValidateIf(o => o.ruleType === RuleType.PROMPT_INJECTION)
  @IsString({ each: true })
  @IsOptional()
  injectionPatterns?: string[];

  // Custom rule parameters
  @ValidateIf(o => o.ruleType === RuleType.CUSTOM)
  @IsString()
  @IsOptional()
  customRule?: string;
}
