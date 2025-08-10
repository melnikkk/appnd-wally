import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { RuleType } from '../rule.types';

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(RuleType)
  type: RuleType;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Min(0, { message: 'Threshold must be between 0 and 1' })
  @Max(1, { message: 'Threshold must be between 0 and 1' })
  threshold?: number;
}
