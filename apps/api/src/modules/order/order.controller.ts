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

  /** 法大大签约 */
  @Post(':id/sign/fadadada')
  signFadadada(@CurrentUser('id') studentId: string, @Param('id') orderId: string) {
    return this.orderService.signWithProvider(studentId, orderId, 'fadadada');
  }

  /** e签宝签约 */
  @Post(':id/sign/eqianbao')
  signEqianbao(@CurrentUser('id') studentId: string, @Param('id') orderId: string) {
    return this.orderService.signWithProvider(studentId, orderId, 'eqianbao');
  }

  /** 查询签约状态 */
  @Get(':id/sign/status')
  signStatus(@CurrentUser('id') studentId: string, @Param('id') orderId: string) {
    return this.orderService.getSignStatus(studentId, orderId);
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
