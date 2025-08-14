import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/exceptions/base.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

export class AIProviderInternalException extends BaseException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.AI_PROVIDER_KEY_NOT_FOUND,
      details,
    );
  }
}
