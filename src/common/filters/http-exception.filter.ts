import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../logger.config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? exception.getResponse()
      : 'Erro interno no servidor.';

    const errorResponse =
      typeof message === 'string'
        ? { message }
        : message && typeof message === 'object'
          ? message
          : { message: 'Erro desconhecido.' };

    const log = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      status,
      error: errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status >= 500) {
      logger.error(log);
    }

    if (!isHttpException || status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Ocorreu um erro interno',
        path: request.url,
      });
    }

    return response.status(status).json({
      ...errorResponse,
      statusCode: status,
      path: request.url,
    });
  }
}
