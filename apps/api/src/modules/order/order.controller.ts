import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequireRole } from "../../common/auth/roles.decorator";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { OrderService } from "./order.service";
import {
  CreateOrderReqDto,
  type CreateOrderRespDto,
  type OrderDetailDto,
  type OrderListDto,
  type ZhimaInitializeRespDto,
  type ZhimaConfirmRespDto,
  type RepayRespDto,
} from "./dto/order.dto";

@Controller("orders")
@UseGuards(SimpleAuthGuard)
@RequireRole("STUDENT")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<OrderListDto> {
    return this.orderService.list(user.subject);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOrderReqDto,
  ): Promise<CreateOrderRespDto> {
    return this.orderService.create(user.subject, body);
  }

  @Get(":orderId")
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
  ): Promise<OrderDetailDto> {
    return this.orderService.detail(user.subject, orderId);
  }

  // ── 芝麻先享（仅 DEFERRED 订单）────────────────────────

  @Post(":orderId/zhima/initialize")
  zhimaInitialize(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
  ): Promise<ZhimaInitializeRespDto> {
    return this.orderService.zhimaInitialize(user.subject, orderId);
  }

  @Post(":orderId/zhima/confirm")
  zhimaConfirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
  ): Promise<ZhimaConfirmRespDto> {
    return this.orderService.zhimaConfirm(user.subject, orderId);
  }

  // ── 逾期履约还款 ─────────────────────────────────────────

  @Post(":orderId/installments/:periodNo/repay")
  repay(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
    @Param("periodNo", ParseIntPipe) periodNo: number,
  ): Promise<RepayRespDto> {
    return this.orderService.repay(user.subject, orderId, periodNo);
  }
}

// 芝麻先享扣款回调（无需认证，由支付宝服务器调用）
@Controller("orders/zhima")
export class ZhimaWebhookController {
  constructor(private readonly orderService: OrderService) {}

  @Post("notify")
  async notify(@Body() body: Record<string, string>): Promise<string> {
    await this.orderService.handleZhimaNotify(body);
    return "success";
  }
}

// 普通收单支付回调（IMMEDIATE 首付 + 逾期还款，无需认证）
@Controller("orders/trade")
export class TradeWebhookController {
  constructor(private readonly orderService: OrderService) {}

  @Post("notify")
  async notify(@Body() body: Record<string, string>): Promise<string> {
    await this.orderService.handleTradeNotify(body);
    return "success";
  }
}
