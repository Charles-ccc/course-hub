import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, TokenService],
})
export class AuthModule {}
