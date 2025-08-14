import { Module } from '@nestjs/common';
import { KeywordRuleMatcher } from './keyword-rule-matcher';
import { SemanticRuleMatcher } from './semantic-rule-matcher';
import { PolicyMatcherService } from './policy-matcher.service';
import { AnalysisModule } from '../../analysis/analysis.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [AnalysisModule, PrismaModule],
  providers: [
    KeywordRuleMatcher,
    SemanticRuleMatcher,
    {
      provide: 'RULE_MATCHERS',
      useFactory: (
        keywordMatcher: KeywordRuleMatcher,
        semanticMatcher: SemanticRuleMatcher,
      ) => [keywordMatcher, semanticMatcher],
      inject: [KeywordRuleMatcher, SemanticRuleMatcher],
    },
    PolicyMatcherService,
  ],
  exports: [PolicyMatcherService],
})
export class PolicyMatchersModule {}
