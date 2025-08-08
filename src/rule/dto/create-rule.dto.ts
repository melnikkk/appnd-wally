import { IsString, IsOptional, IsEnum } from 'class-validator';
import { RuleType } from '../rule.types';

export class CreateRuleDto {
  @IsString()
  name: string;

  @IsEnum(RuleType)
  type: RuleType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pattern?: string; // KEYWORD_BLOCK type
}
