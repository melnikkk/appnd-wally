import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRuleDto } from '../../rule/dto/create-rule.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyMode } from '../policy.types';

export class CreatePolicyDto {
  @ApiProperty({ description: 'Policy name', example: 'Security Policy' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Policy strategy mode',
    enum: PolicyMode,
    example: 'BLOCKLIST',
    default: PolicyMode.BLOCKLIST,
  })
  @IsEnum(PolicyMode)
  mode: PolicyMode;

  @ApiPropertyOptional({
    description: 'Policy description',
    example: 'This policy enforces security rules',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether the policy is active', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Threshold for semantic rules (0 to 1)',
    example: 0.55,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Min(0)
  @Max(1)
  threshold: number;

  @ApiProperty({
    description: 'List of rules associated with this policy',
    type: [CreateRuleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  rules: Array<CreateRuleDto>;
}
