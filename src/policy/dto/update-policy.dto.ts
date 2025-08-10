import { ApiExtraModels } from '@nestjs/swagger';
import { CreatePolicyDto } from './create-policy.dto';
// Use PartialType from @nestjs/swagger instead of @nestjs/mapped-types
import { PartialType } from '@nestjs/swagger';

@ApiExtraModels(CreatePolicyDto)
export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}
