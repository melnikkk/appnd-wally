import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Query
} from '@nestjs/common';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyEvaluationService } from './policy-evaluation.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('policies')
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly policyEvaluationService: PolicyEvaluationService
  ) {}

  @Post()
  async create(@CurrentUser() user, @Body() createPolicyDto: CreatePolicyDto) {
    return this.policyService.create(user.id, createPolicyDto);
  }
  
  @Post('evaluate')
  async evaluatePrompt(
    @CurrentUser() user,
    @Body() evaluatePromptDto: { prompt: string; organizationId?: string }
  ) {
    const { prompt, organizationId = user.organizationId } = evaluatePromptDto;
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    
    const evaluation = await this.policyEvaluationService.evaluatePrompt(
      organizationId,
      prompt
    );
    
    await this.policyEvaluationService.logEvaluation(
      organizationId,
      user.id,
      prompt,
      evaluation
    );
    
    return evaluation;
  }

  @Get()
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
  findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.policyService.remove(id);
  }
}
