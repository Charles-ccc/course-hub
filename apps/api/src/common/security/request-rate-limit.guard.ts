import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { ApiBusinessException } from "../exceptions/api-business.exception";
import { RateLimitStoreService } from "./rate-limit-store.service";

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  ip?: string;
  socket?: { remoteAddress?: string };
  originalUrl?: string;
  method?: string;
};

@Injectable()
export class RequestRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RequestRateLimitGuard.name);
  private readonly loginWindowMs = 5 * 60 * 1000;
  private readonly loginLimit = 20;
  private readonly refreshWindowMs = 60 * 1000;
  private readonly refreshLimit = 30;

  constructor(private readonly rateLimitStore: RateLimitStoreService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const path = request.originalUrl ?? "";
    const method = request.method ?? "";

    if (method === "POST" && path.includes("/auth/phone/login")) {
      await this.hitOrThrow(
        this.buildLoginKey(request),
        this.loginWindowMs,
        this.loginLimit,
      );
      return true;
    }

    if (method === "POST" && path.includes("/auth/refresh")) {
      await this.hitOrThrow(
        this.buildRefreshKey(request),
        this.refreshWindowMs,
        this.refreshLimit,
      );
      return true;
    }

    return true;
  }

  private async hitOrThrow(
    key: string,
    windowMs: number,
    limit: number,
  ): Promise<void> {
    const currentCount = await this.rateLimitStore.hit(key, windowMs);

    if (currentCount > limit) {
      this.logger.warn(`Rate limit blocked: keyHash=${this.hashKey(key)}`);
      throw new ApiBusinessException(42901, "请求过于频繁，请稍后再试", 429);
    }
  }

  private buildLoginKey(request: RequestLike): string {
    const ip = this.getClientIp(request);
    const phoneRaw = String(request.body?.phone ?? "").trim();
    const phone = phoneRaw
      ? `phone:${this.hashKey(phoneRaw)}`
      : "phone:unknown";
    return `login:${ip}:${phone}`;
  }

  private buildRefreshKey(request: RequestLike): string {
    const ip = this.getClientIp(request);
    return `refresh:${ip}`;
  }

  private getClientIp(request: RequestLike): string {
    const xff = request.headers?.["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
      return xff.split(",")[0].trim();
    }

    if (Array.isArray(xff) && xff.length > 0) {
      const first = xff[0];
      if (first && first.trim()) {
        return first.split(",")[0].trim();
      }
    }

    return request.ip ?? request.socket?.remoteAddress ?? "unknown";
  }

  private hashKey(input: string): string {
    return createHash("sha256").update(input).digest("hex").slice(0, 16);
  }
}
