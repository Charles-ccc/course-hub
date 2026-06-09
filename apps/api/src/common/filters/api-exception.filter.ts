import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = context.getRequest<
      Request & { headers?: Record<string, string> }
    >();

    const requestId = request.headers?.["x-request-id"] ?? randomUUID();
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = status;
    let message = "Internal server error";
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        code = status;
      } else if (exceptionResponse && typeof exceptionResponse === "object") {
        const responseBody = exceptionResponse as {
          code?: number;
          message?: string | string[];
          details?: Record<string, unknown>;
        };
        code = responseBody.code ?? status;
        message = Array.isArray(responseBody.message)
          ? responseBody.message.join("; ")
          : (responseBody.message ?? exception.message);
        details = responseBody.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}
