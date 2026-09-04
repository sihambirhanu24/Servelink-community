import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      exceptionResponse === null
        ? 'Internal server error'
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>).message ??
            'Internal server error');

    // Preserve structured error payloads (e.g. `code: 'ACCOUNT_SUSPENDED'` plus
    // suspension dates, or `code: 'VERIFICATION_PENDING'`) so clients can branch
    // on a stable application code instead of parsing messages.
    const details =
      exceptionResponse !== null && typeof exceptionResponse === 'object'
        ? (exceptionResponse as Record<string, unknown>)
        : {};

    response.status(status).json({
      ...details,
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
