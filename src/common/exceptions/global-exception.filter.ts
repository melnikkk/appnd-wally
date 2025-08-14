import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseException } from './base.exception';
import { ErrorCode } from './error-codes.enum';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = ErrorCode.INTERNAL_ERROR;
    let details = undefined;

    if (exception instanceof BaseException) {
      const exceptionResponse = exception.getResponse() as any;

      statusCode = exception.getStatus();
      message = exceptionResponse.message;
      code = exceptionResponse.code || this.getDefaultCodeByStatus(statusCode);
      details = exceptionResponse.details;
    } else if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;

      statusCode = exception.getStatus();
      message =
        typeof exceptionResponse === 'object'
          ? exceptionResponse.message || exception.message
          : exceptionResponse;
      code = this.getDefaultCodeByStatus(statusCode);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`${request.method} ${request.url}`, {
      exception: exception instanceof Error ? exception.stack : String(exception),
      statusCode,
      body: request.body,
    });

    response.status(statusCode).send({
      statusCode,
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getDefaultCodeByStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.UNPROCESSABLE_ENTITY;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
