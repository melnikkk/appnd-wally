import { IsString, IsNotEmpty } from 'class-validator';

export class EvaluatePromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
