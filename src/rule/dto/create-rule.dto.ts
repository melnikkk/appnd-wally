import { IsString } from 'class-validator';

export class CreateRuleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
