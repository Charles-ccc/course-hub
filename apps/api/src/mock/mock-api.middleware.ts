import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { MockApiStateService } from "./mock-api-state.service";

@Injectable()
export class MockApiMiddleware implements NestMiddleware {
  constructor(private readonly mockApiState: MockApiStateService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const result = this.mockApiState.handle(req);

    if (!result?.handled) {
      next();
      return;
    }

    res.status(result.status).json({
      code: result.status === 200 ? 200 : result.status,
      message: result.message,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  }
}
