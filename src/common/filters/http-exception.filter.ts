import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import type { IApiErrorResponse } from '../types/api-response.interface';
import { RESPONSE_MESSAGES } from '@/common/constants/messages.constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    // const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string = RESPONSE_MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
    let errors: string[] | undefined;
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          errors?: string[];
          errorCode?: string;
        };

        if (Array.isArray(responseObj.message)) {
          message = RESPONSE_MESSAGES.COMMON.VALIDATION_FAILED;
          errors = responseObj.message;
        } else {
          message = responseObj.message ?? message;
          errors = responseObj.errors;
        }

        errorCode = responseObj.errorCode;
      }
    }

    const errorResponse: IApiErrorResponse = {
      success: false,
      message,
      errors,
      errorCode,
    };

    response.status(status).json(errorResponse);
  }
}
