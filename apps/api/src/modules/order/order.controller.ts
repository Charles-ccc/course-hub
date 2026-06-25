import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
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

  // Module 9 电子签约占位：当前返回 501
  @Post(":orderId/sign/initialize")
  signInitialize(): never {
    throw new HttpException(
      { code: 50100, message: "签约功能即将上线，敬请期待" },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
