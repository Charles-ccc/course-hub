import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { TokenService } from "../../common/auth/token.service";

@Module({
  controllers: [OrderController],
  providers: [OrderService, TokenService, JwtService, Reflector],
})
export class OrderModule {}
