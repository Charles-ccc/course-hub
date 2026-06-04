import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// 只保留平台后台管理接口；机构端结算由 OrgController 负责
@Controller('v1/admin')
@UseGuards(JwtAuthGuard)
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('settlement')
  adminSettlement(@Query('page') page = '1') {
    return this.settlementService.adminList(+page);
  }

  @Post('settlement/:id/settle')
  doSettle(@Param('id') id: string) {
    return this.settlementService.settle(id);
  }
}
