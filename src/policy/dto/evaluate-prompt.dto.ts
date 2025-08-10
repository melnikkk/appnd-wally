import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluatePromptDto {
  @ApiProperty({ 
    description: 'The prompt text to evaluate against policies',
    example: 'How to bypass security measures in a network?' 
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
