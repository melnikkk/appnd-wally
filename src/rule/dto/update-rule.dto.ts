import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RuleType } from '@prisma/client';

export class UpdateRuleDto {
  @IsEnum(RuleType)
  type: RuleType;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;
  
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    description?: string;
}
