import {
  UnauthorizedException,
  ForbiddenException,
} from '../../common/exceptions/common.exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

export class InvalidSessionException extends UnauthorizedException {
  constructor(message: string = 'Invalid session', details?: Record<string, any>) {
    super(message, ErrorCode.INVALID_SESSION, details);
  }
}

export class UserNotFoundException extends UnauthorizedException {
  constructor(userId: string) {
    super(`User with ID '${userId}' not found`, ErrorCode.USER_NOT_FOUND, { userId });
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(message: string = 'Insufficient permissions to access this resource') {
    super(message, ErrorCode.INSUFFICIENT_PERMISSIONS);
  }
}
