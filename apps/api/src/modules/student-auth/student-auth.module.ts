import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { StudentAuthController } from "./student-auth.controller";
import { StudentAuthService } from "./student-auth.service";
import { AlipayService } from "./alipay.service";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [StudentAuthController],
  providers: [StudentAuthService, AlipayService, JwtService, TokenService],
  exports: [AlipayService],
})
export class StudentAuthModule {}
