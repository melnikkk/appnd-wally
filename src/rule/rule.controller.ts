import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RuleService } from './rule.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { 
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('rules')
@ApiBearerAuth()
@Controller('policies/:policyId/rules')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rule', description: 'Creates a new rule for a specific policy' })
  @ApiResponse({ status: 201, description: 'Rule successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiParam({ name: 'policyId', description: 'Policy ID to create a rule for' })
  @ApiBody({ type: CreateRuleDto })
  create(@Param('policyId') policyId: string, @Body() createRuleDto: CreateRuleDto) {
    return this.ruleService.create(policyId, createRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rules for a policy', description: 'Returns all rules for a specific policy' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiParam({ name: 'policyId', description: 'Policy ID to get rules for' })
  findAll(@Param('policyId') policyId: string) {
    return this.ruleService.findAllByPolicyId(policyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rule by ID', description: 'Returns a rule by its ID' })
  @ApiResponse({ status: 200, description: 'The rule' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiParam({ name: 'policyId', description: 'Policy ID the rule belongs to' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  findOne(@Param('id') id: string) {
    return this.ruleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a rule', description: 'Updates a rule by its ID' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiParam({ name: 'policyId', description: 'Policy ID the rule belongs to' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiBody({ type: UpdateRuleDto })
  update(@Param('id') id: string, @Body() updateRuleDto: UpdateRuleDto) {
    return this.ruleService.update(id, updateRuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rule', description: 'Deletes a rule by its ID' })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiParam({ name: 'policyId', description: 'Policy ID the rule belongs to' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  remove(@Param('id') id: string) {
    return this.ruleService.remove(id);
  }
}
