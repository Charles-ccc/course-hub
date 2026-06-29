import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import {
  OrderController,
  ZhimaWebhookController,
  TradeWebhookController,
} from "./order.controller";
import { OrderService } from "./order.service";
import { TokenService } from "../../common/auth/token.service";
import { StudentAuthModule } from "../student-auth/student-auth.module";

@Module({
  imports: [StudentAuthModule],
  controllers: [OrderController, ZhimaWebhookController, TradeWebhookController],
  providers: [OrderService, TokenService, JwtService, Reflector],
})
export class OrderModule {}
