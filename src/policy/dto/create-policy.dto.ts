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
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRuleDto } from '../../rule/dto/create-rule.dto';

export class CreatePolicyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  organizationId: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Min(0)
  @Max(1)
  threshold?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  rules: Array<CreateRuleDto>;
}
