import { BaseException } from '../../../common/exceptions/base.exception';
import { HttpStatus } from '@nestjs/common';
import { NotFoundException } from '../../../common/exceptions/common.exceptions';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class QueueNotFoundException extends NotFoundException {
  constructor(queueName: string) {
    super(`Queue with name '${queueName}' not found`, ErrorCode.QUEUE_NOT_FOUND, { queueName });
  }
}

export class JobAddException extends BaseException {
  constructor(
    queueName: string,
    jobName: string,
    details?: Record<string, any>
  ) {
    super(
      `Failed to add job '${jobName}' to queue '${queueName}'`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.JOB_ADD_FAILED,
      { queueName, jobName, ...details }
    );
  }
}

export class QueueOperationException extends BaseException {
  constructor(
    operation: string,
    queueName: string,
    details?: Record<string, any>
  ) {
    super(
      `Failed to ${operation} queue '${queueName}'`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.QUEUE_OPERATION_FAILED,
      { queueName, operation, ...details }
    );
  }
}
