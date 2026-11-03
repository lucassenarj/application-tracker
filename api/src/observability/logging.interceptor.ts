import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { AxiomClient } from './axiom-client';
import { redactSensitiveFields } from './redact-sensitive-fields';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly axiomClient = new AxiomClient();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (request.path === '/health') {
      return next.handle();
    }

    const startTime = Date.now();

    response.on('finish', () => {
      this.axiomClient.logRequest({
        method: request.method,
        path: request.originalUrl ?? request.url,
        status: response.statusCode,
        durationMs: Date.now() - startTime,
        body: redactSensitiveFields(
          request.body as Record<string, unknown> | null | undefined,
        ),
      });
    });

    return next.handle();
  }
}
