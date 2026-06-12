import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { createClient } from "redis";

@Injectable()
export class RateLimitStoreService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitStoreService.name);
  private readonly redisPrefix = "wangke:rl";
  private readonly redisClient: ReturnType<typeof createClient>;

  constructor() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      throw new Error("REDIS_URL is required for rate limiting");
    }

    this.redisClient = createClient({ url: redisUrl });
    this.redisClient.on("error", (error) => {
      this.logger.error(`Redis rate limit client error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.redisClient.connect();
    await this.redisClient.ping();
    this.logger.log("Redis rate limit store enabled and healthy");
  }

  async hit(key: string, windowMs: number): Promise<number> {
    if (!this.redisClient.isReady) {
      throw new Error("Redis rate limit store is not ready");
    }

    const redisKey = `${this.redisPrefix}:${key}`;
    const count = await this.redisClient.incr(redisKey);
    if (count === 1) {
      await this.redisClient.pExpire(redisKey, windowMs);
    }
    return count;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }
}
