import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RuleType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRuleDto {
  @ApiProperty({ 
    description: 'Rule type', 
    enum: RuleType,
    example: 'KEYWORD_BLOCK' 
  })
  @IsEnum(RuleType)
  type: RuleType;

  @ApiPropertyOptional({ 
    description: 'Rule name', 
    example: 'Updated Rule Name' 
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
  
  @ApiPropertyOptional({ 
    description: 'Rule description', 
    example: 'Updated rule description' 
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;
}
