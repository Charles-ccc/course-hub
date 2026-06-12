import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { TokenService } from "../../common/auth/token.service";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  controllers: [StaffController],
  providers: [
    StaffService,
    Reflector,
    JwtService,
    TokenService,
    SimpleAuthGuard,
  ],
})
export class StaffModule {}
