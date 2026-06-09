import { HttpException, HttpStatus } from "@nestjs/common";

export class ApiBusinessException extends HttpException {
  constructor(
    code: number,
    message: string,
    status: number = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}
