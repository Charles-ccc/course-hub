import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { InstitutionController } from "./institution.controller";
import { InstitutionService } from "./institution.service";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [InstitutionController],
  providers: [
    InstitutionService,
    Reflector,
    JwtService,
    TokenService,
    SimpleAuthGuard,
  ],
})
export class InstitutionModule {}
