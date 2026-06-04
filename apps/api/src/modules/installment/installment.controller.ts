import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { InstallmentService } from './installment.service';
import { DeductionService } from './deduction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1')
@UseGuards(JwtAuthGuard)
export class InstallmentController {
  constructor(
    private readonly installmentService: InstallmentService,
    private readonly deductionService: DeductionService,
  ) {}

  @Get('orders/:orderId/installments')
  list(@Param('orderId') orderId: string) {
    return this.installmentService.listByOrder(orderId);
  }

  // 内部接口：机构触发当期代扣，ID 从 body 传入
  @Post('internal/deduction/run')
  runDeduction(@Body('installmentItemId') installmentItemId: string) {
    return this.deductionService.triggerDeduction(installmentItemId);
  }
}
