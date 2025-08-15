import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/exceptions/base.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

export class UserNotFoundException extends BaseException {
  constructor(id: string) {
    super(`User with ID ${id} not found`, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
  }
}

export class UserAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      HttpStatus.CONFLICT,
      ErrorCode.CONFLICT,
    );
  }
}

export class UserCreationException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, details);
  }
}
