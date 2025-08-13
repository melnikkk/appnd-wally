import { NotFoundException, BadRequestException } from '../../common/exceptions/common.exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

export class RuleNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Rule with ID '${id}' not found`, ErrorCode.RULE_NOT_FOUND, { ruleId: id });
  }
}

export class RuleCreationException extends BadRequestException {
  constructor(message: string = 'Failed to create rule', details?: Record<string, any>) {
    super(message, ErrorCode.RULE_CREATION_FAILED, details);
  }
}

export class RuleUpdateException extends BadRequestException {
  constructor(id: string, details?: Record<string, any>) {
    super(`Failed to update rule with ID '${id}'`, ErrorCode.RULE_UPDATE_FAILED, {
      ruleId: id,
      ...details,
    });
  }
}

export class RuleDeletionException extends BadRequestException {
  constructor(id: string, details?: Record<string, any>) {
    super(`Failed to delete rule with ID '${id}'`, ErrorCode.RULE_DELETION_FAILED, {
      ruleId: id,
      ...details,
    });
  }
}
