import { ApiExtraModels } from '@nestjs/swagger';
import { CreatePolicyDto } from './create-policy.dto';
import { PartialType } from '@nestjs/swagger';

@ApiExtraModels(CreatePolicyDto)
export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}
