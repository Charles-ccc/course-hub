import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CreditService } from './credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/credit')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('authorize')
  authorize(@CurrentUser('id') studentId: string, @Body() dto: { orderId: string; scenario: string }) {
    return this.creditService.authorize(studentId, dto.orderId, dto.scenario as any);
  }

  @Get('decision/:orderId')
  decision(@Param('orderId') orderId: string) {
    return this.creditService.getDecision(orderId);
  }

  @Post('sign-agreement')
  signAgreement(@CurrentUser('id') studentId: string, @Body() dto: { orderId: string }) {
    return this.creditService.signAgreement(studentId, dto.orderId);
  }
}
