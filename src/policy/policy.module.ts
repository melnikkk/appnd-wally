import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { RuleService } from '../rule/rule.service';
import { RuleController } from '../rule/rule.controller';
import { PolicyEvaluationService } from './policy-evaluation.service';
import { PrismaPolicyRepository } from './repositories/prisma-policy.repository';
import { POLICY_REPOSITORY } from './repositories/policy-repository.interface';
import { PolicyMatchersModule } from './matchers/policy-matchers.module';

@Module({
  imports: [PrismaModule, AnalysisModule, PolicyMatchersModule],
  providers: [
    PolicyService,
    RuleService,
    PolicyEvaluationService,
    {
      provide: POLICY_REPOSITORY,
      useClass: PrismaPolicyRepository,
    },
  ],
  controllers: [PolicyController, RuleController],
  exports: [PolicyService, RuleService, PolicyEvaluationService],
})
export class PolicyModule {}
