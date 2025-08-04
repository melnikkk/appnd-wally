import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  @IsOptional()
  rules?: CreateRuleDto[];
}
