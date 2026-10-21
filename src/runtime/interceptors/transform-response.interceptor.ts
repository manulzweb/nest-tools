import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardApiResponse<T> {
  statusCode: number;
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Global or controller interceptor that wraps successful responses in a standard JSON envelope.
 *
 * @example
 * ```typescript
 * // In main.ts
 * app.useGlobalInterceptors(new TransformResponseInterceptor());
 * ```
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<StandardApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response?.statusCode ?? 200;

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        success: statusCode >= 200 && statusCode < 400,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
