import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { randomUUID } from "node:crypto";
import { Observable, catchError, tap, throwError } from "rxjs";

type RequestWithHeaders = Request & {
  method: string;
  originalUrl?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: { subject?: string; role?: string };
};

type ResponseWithStatus = {
  statusCode?: number;
};

@Injectable()
export class RequestAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestAuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithHeaders>();
    const response = http.getResponse<ResponseWithStatus>();

    const requestId = this.getHeader(request, "x-request-id") ?? randomUUID();
    const method = request.method;
    const path = request.originalUrl ?? "";
    const ip = this.getClientIp(request);
    const userAgent = this.getHeader(request, "user-agent") ?? "unknown";

    return next.handle().pipe(
      tap(() => {
        const latencyMs = Date.now() - now;
        const status = response.statusCode ?? 200;
        const payload = {
          event: "api_request",
          requestId,
          method,
          path,
          ip,
          userAgent,
          status,
          latencyMs,
          userId: request.user?.subject,
          role: request.user?.role,
        };
        this.logger.log(JSON.stringify(payload));
        void this.persistAuditLog({
          ...payload,
          success: true,
        });
      }),
      catchError((error: unknown) => {
        const latencyMs = Date.now() - now;
        const status =
          error instanceof HttpException
            ? error.getStatus()
            : (response.statusCode ?? 500);
        const errorPayload =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : {
                name: "UnknownError",
                message: String(error),
              };

        this.logger.warn(
          JSON.stringify({
            event: "api_request_error",
            requestId,
            method,
            path,
            ip,
            userAgent,
            status,
            latencyMs,
            userId: request.user?.subject,
            role: request.user?.role,
            error: errorPayload,
          }),
        );

        void this.persistAuditLog({
          requestId,
          method,
          path,
          ip,
          userAgent,
          status,
          latencyMs,
          userId: request.user?.subject,
          role: request.user?.role,
          success: false,
          errorName: errorPayload.name,
          errorMessage: errorPayload.message,
        });

        return throwError(() => error);
      }),
    );
  }

  private async persistAuditLog(input: {
    requestId: string;
    method: string;
    path: string;
    ip: string;
    userAgent: string;
    status: number;
    latencyMs: number;
    success: boolean;
    userId?: string;
    role?: string;
    errorName?: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.prisma.apiAuditLog.create({
        data: {
          id: randomUUID(),
          requestId: input.requestId,
          method: input.method,
          path: input.path,
          ip: input.ip,
          userAgent: input.userAgent,
          status: input.status,
          latencyMs: input.latencyMs,
          success: input.success,
          userId: input.userId,
          role: input.role,
          errorName: input.errorName,
          errorMessage: input.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error(
        `Persist audit log failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private getHeader(
    request: RequestWithHeaders,
    key: string,
  ): string | undefined {
    const value = request.headers?.[key];
    if (typeof value === "string") {
      return value;
    }
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
    return undefined;
  }

  private getClientIp(request: RequestWithHeaders): string {
    const xff = this.getHeader(request, "x-forwarded-for");
    if (xff && xff.trim()) {
      return xff.split(",")[0].trim();
    }
    return request.ip ?? "unknown";
  }
}
