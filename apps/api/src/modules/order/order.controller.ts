import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@CurrentUser('id') studentId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(studentId, dto);
  }

  @Post(':id/sign')
  sign(@CurrentUser('id') studentId: string, @Param('id') orderId: string) {
    return this.orderService.signContract(studentId, orderId);
  }

  @Post(':id/refund')
  refund(@CurrentUser('id') studentId: string, @Param('id') orderId: string) {
    return this.orderService.coolingOffRefund(studentId, orderId);
  }

  @Get()
  list(@CurrentUser('id') studentId: string) {
    return this.orderService.listStudentOrders(studentId);
  }

  @Get(':id')
  detail(@CurrentUser('id') studentId: string, @Param('id') orderId: string) {
    return this.orderService.getOrderDetail(studentId, orderId);
  }
}
