import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { RuleService } from '../rule/rule.service';
import { RuleController } from '../rule/rule.controller';
import { PolicyEvaluationService } from './policy-evaluation.service';
import { PrismaPolicyRepository } from './repositories/prisma-policy.repository';
import { PolicyRepository } from './repositories/policy-repository.interface';

@Module({
  imports: [PrismaModule, AnalysisModule],
  providers: [
    PolicyService,
    RuleService,
    PolicyEvaluationService,
    {
      provide: PolicyRepository,
      useClass: PrismaPolicyRepository,
    },
  ],
  controllers: [PolicyController, RuleController],
  exports: [PolicyService, RuleService, PolicyEvaluationService],
})
export class PolicyModule {}
