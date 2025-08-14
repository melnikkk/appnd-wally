import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/exceptions/base.exception';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '../../common/exceptions/common.exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

export class PolicyNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Policy with ID '${id}' not found`, ErrorCode.POLICY_NOT_FOUND, {
      policyId: id,
    });
  }
}

export class PolicyCreationException extends BadRequestException {
  constructor(
    message: string = 'Failed to create policy',
    details?: Record<string, any>,
  ) {
    super(message, ErrorCode.POLICY_CREATION_FAILED, details);
  }
}

export class PolicyEvaluationException extends BaseException {
  constructor(
    message: string = 'Policy evaluation failed',
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.POLICY_EVALUATION_FAILED,
      details,
    );
  }
}

export class PolicyForbiddenException extends ForbiddenException {
  constructor(message: string = 'User does not have access to this policy') {
    super(message, ErrorCode.POLICY_FORBIDDEN_ACCESS);
  }
}
