import { BaseException } from '../../../common/exceptions/base.exception';
import {
  BadRequestException,
  UnauthorizedException,
} from '../../../common/exceptions/common.exceptions';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class WebhookSignatureVerificationException extends UnauthorizedException {
  constructor() {
    super('Invalid webhook signature', ErrorCode.WEBHOOK_INVALID_SIGNATURE);
  }
}

export class MissingWebhookHeadersException extends BadRequestException {
  constructor() {
    super('Missing required webhook headers', ErrorCode.WEBHOOK_MISSING_HEADERS);
  }
}

export class WebhookHandlingException extends BaseException {
  constructor(
    eventType: string,
    message: string = `Error processing webhook event ${eventType}`,
    details?: Record<string, any>
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.WEBHOOK_HANDLING_FAILED,
      { eventType, ...details }
    );
  }
}

export class UnsupportedWebhookEventException extends BadRequestException {
  constructor(eventType: string) {
    super(
      `Webhook event '${eventType}' not supported`,
      ErrorCode.WEBHOOK_EVENT_NOT_SUPPORTED,
      { eventType }
    );
  }
}
