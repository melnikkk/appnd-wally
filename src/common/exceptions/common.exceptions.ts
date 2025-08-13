import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from './error-codes.enum';

export class NotFoundException extends BaseException {
  constructor(
    message: string = 'Resource not found',
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.NOT_FOUND, code, details);
  }
}

export class BadRequestException extends BaseException {
  constructor(
    message: string = 'Bad request',
    code: ErrorCode = ErrorCode.BAD_REQUEST,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.BAD_REQUEST, code, details);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(
    message: string = 'Unauthorized access',
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.UNAUTHORIZED, code, details);
  }
}

export class ForbiddenException extends BaseException {
  constructor(
    message: string = 'Access forbidden',
    code: ErrorCode = ErrorCode.FORBIDDEN,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.FORBIDDEN, code, details);
  }
}

export class ConflictException extends BaseException {
  constructor(
    message: string = 'Conflict occurred',
    code: ErrorCode = ErrorCode.CONFLICT,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.CONFLICT, code, details);
  }
}

export class InternalServerErrorException extends BaseException {
  constructor(
    message: string = 'Internal server error',
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, code, details);
  }
}

export class ValidationException extends BaseException {
  constructor(
    message: string = 'Validation failed',
    code: ErrorCode = ErrorCode.UNPROCESSABLE_ENTITY,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, code, details);
  }
}

export class RateLimitException extends BaseException {
  constructor(
    message: string = 'Rate limit exceeded',
    code: ErrorCode = ErrorCode.TOO_MANY_REQUESTS,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, code, details);
  }
}
