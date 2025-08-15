import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { RuleType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRuleDto {
  @ApiProperty({
    description: 'Rule type',
    enum: RuleType,
    example: 'KEYWORD_BLOCK',
  })
  @IsEnum(RuleType)
  @IsOptional()
  type?: RuleType;

  @ApiPropertyOptional({
    description: 'Rule name',
    example: 'Updated Rule Name',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Updated rule description',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

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
