import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
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
}
