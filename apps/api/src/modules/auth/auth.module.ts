import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RequestRateLimitGuard } from "../../common/security/request-rate-limit.guard";
import { RateLimitStoreService } from "../../common/security/rate-limit-store.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    TokenService,
    RateLimitStoreService,
    RequestRateLimitGuard,
  ],
})
export class AuthModule {}
