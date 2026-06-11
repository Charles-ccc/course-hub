import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { InsitutionController } from "./insitution.controller";
import { InsitutionService } from "./insitution.service";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [InsitutionController],
  providers: [
    InsitutionService,
    Reflector,
    JwtService,
    TokenService,
    SimpleAuthGuard,
  ],
})
export class InsitutionModule {}
