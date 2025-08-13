import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/exceptions/base.exception';
import { NotFoundException } from '../../common/exceptions/common.exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

export class JobNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Job with ID '${id}' not found`, ErrorCode.JOB_NOT_FOUND, { jobId: id });
  }
}

export class LogProcessingException extends BaseException {
  constructor(
    message: string = 'Failed to process logs',
    details?: Record<string, any>
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.LOG_PROCESSING_FAILED, details);
  }
}

export class AnalyticsSchedulingException extends BaseException {
  constructor(
    message: string = 'Failed to schedule analytics job',
    details?: Record<string, any>
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.ANALYTICS_SCHEDULING_FAILED, details);
  }
}
