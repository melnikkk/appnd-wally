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
import { ApiProperty } from '@nestjs/swagger';

export class CreateRuleDto {
  @ApiProperty({
    description: 'Rule name',
    example: 'No Password Sharing',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Rule description',
    example: 'This rule blocks prompts asking for password sharing',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Rule type',
    enum: RuleType,
    example: RuleType.KEYWORD_BLOCK,
  })
  @IsEnum(RuleType)
  type: RuleType;

  @ApiProperty({
    description: 'Threshold for semantic rules (0 to 1)',
    example: 0.55,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Min(0, { message: 'Threshold must be between 0 and 1' })
  @Max(1, { message: 'Threshold must be between 0 and 1' })
  threshold?: number;
}
