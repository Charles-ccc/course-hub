import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    Reflector,
    JwtService,
    TokenService,
    SimpleAuthGuard,
  ],
})
export class AdminModule {}
