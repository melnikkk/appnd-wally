import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { RuleService } from '../rule/rule.service';
import { RuleController } from '../rule/rule.controller';
import { PolicyEvaluationService } from './policy-evaluation.service';

@Module({
  imports: [PrismaModule, AnalysisModule],
  providers: [PolicyService, RuleService, PolicyEvaluationService],
  controllers: [PolicyController, RuleController],
  exports: [PolicyService, RuleService, PolicyEvaluationService],
})
export class PolicyModule {}
