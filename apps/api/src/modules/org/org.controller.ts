import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { OrgService } from './org.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/org')
@UseGuards(JwtAuthGuard)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get('profile')
  profile(@CurrentUser('orgId') orgId: string) {
    return this.orgService.getProfile(orgId);
  }

  @Get('orders')
  orders(@CurrentUser('orgId') orgId: string, @Query('page') page = '1', @Query('size') size = '20') {
    return this.orgService.getOrders(orgId, +page, +size);
  }

  @Post('overdue/:id/action')
  overdueAction(@CurrentUser('orgId') orgId: string, @Param('id') itemId: string, @Body() dto: { action: string; remark?: string }) {
    return this.orgService.handleOverdueAction(orgId, itemId, dto);
  }

  @Get('settlement')
  settlement(@CurrentUser('orgId') orgId: string) {
    return this.orgService.getSettlement(orgId);
  }

  @Get('deposit')
  deposit(@CurrentUser('orgId') orgId: string) {
    return this.orgService.getDepositLedger(orgId);
  }

  @Get('qa')
  qaList(@CurrentUser('orgId') orgId: string, @Query() query: any) {
    return this.orgService.getQaList(orgId, query);
  }

  @Post('qa/:id/reply')
  qaReply(@CurrentUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: { reply: string }) {
    return this.orgService.replyQa(orgId, id, dto.reply);
  }

  @Post('invoices')
  issueInvoice(@CurrentUser('orgId') orgId: string, @Body() dto: any) {
    return this.orgService.issueInvoice(orgId, dto);
  }
}

// 平台后台 - 机构管理
@Controller('v1/admin/orgs')
@UseGuards(JwtAuthGuard)
export class AdminOrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  list(@Query('status') status?: string, @Query('page') page = '1', @Query('size') size = '20') {
    return this.orgService.adminList(status, +page, +size);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: { feeRate: number }) {
    return this.orgService.approve(id, dto.feeRate);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string, @Body() dto: { reason: string }) {
    return this.orgService.suspend(id, dto.reason);
  }
}
