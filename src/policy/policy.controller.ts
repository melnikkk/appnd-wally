import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { EvaluatePromptDto } from './dto/evaluate-prompt.dto';
import { PolicyEvaluationService } from './policy-evaluation.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('policies')
@ApiBearerAuth()
@Controller('policies')
export class PolicyController {
  private readonly logger = new Logger(PolicyController.name);
  
  constructor(
    private readonly policyService: PolicyService,
    private readonly policyEvaluationService: PolicyEvaluationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new policy', description: 'Creates a new policy with associated rules' })
  @ApiResponse({ status: 201, description: 'Policy successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreatePolicyDto })
  async create(@CurrentUser() user, @Body() createPolicyDto: CreatePolicyDto) {
    return this.policyService.create(user.id, createPolicyDto);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate a prompt against policies', description: 'Evaluates the given prompt against active policies' })
  @ApiResponse({ status: 200, description: 'Prompt successfully evaluated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: EvaluatePromptDto })
  async evaluatePrompt(
    @CurrentUser() user,
    @Body() evaluatePromptDto: EvaluatePromptDto,
  ) {
    const { prompt } = evaluatePromptDto;
    const organizationId = user.organizationId;

    this.logger.debug(user)

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const evaluation = await this.policyEvaluationService.evaluatePrompt(
      organizationId,
      prompt,
    );

    console.log(`Evaluation result: ${JSON.stringify(evaluation)}`);

    await this.policyEvaluationService.logEvaluation(
      organizationId,
      user.id,
      prompt,
      evaluation,
    );

    return evaluation;
  }

  @Get()
  @ApiOperation({ summary: 'Get all policies', description: 'Returns all policies for the current user or organization' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization ID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'skip', required: false, description: 'Number of records to skip for pagination', type: Number })
  @ApiQuery({ name: 'take', required: false, description: 'Number of records to take for pagination', type: Number })
  async findAll(
    @CurrentUser() user,
    @Query('organizationId') organizationId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.policyService.findAll({
      userId: user.id,
      organizationId: organizationId || user.organizationId,
      isActive,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a policy by ID', description: 'Returns a policy by its ID' })
  @ApiResponse({ status: 200, description: 'The policy' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a policy', description: 'Updates a policy by its ID' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({ type: UpdatePolicyDto })
  update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a policy', description: 'Deletes a policy by its ID' })
  @ApiResponse({ status: 200, description: 'Policy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  remove(@Param('id') id: string) {
    return this.policyService.remove(id);
  }
}
