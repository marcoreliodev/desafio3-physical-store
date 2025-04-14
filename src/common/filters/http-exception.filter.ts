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

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : exception;

    const log = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status >= 500) {
      logger.error(log);
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return response.status(status).json({
        statusCode: status,
        message: 'Ocorreu um erro interno',
        path: request.url,
      });
    }
    if (exception instanceof HttpException) {
      return response.status(status).json(exception.getResponse());
    }

    return response.status(status).json({
      statusCode: status,
      message: String(message) || 'Erro desconhecido',
      path: request.url,
    });
  }
}
