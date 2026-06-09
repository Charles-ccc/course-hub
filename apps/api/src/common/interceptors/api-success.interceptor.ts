import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { map, Observable } from "rxjs";

interface ApiSuccess<T> {
  code: 0;
  message: "OK";
  requestId: string;
  timestamp: string;
  data: T;
}

@Injectable()
export class ApiSuccessInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccess<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { headers?: Record<string, string> }>();
    const requestId = request.headers?.["x-request-id"] ?? randomUUID();

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: "OK",
        requestId,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
