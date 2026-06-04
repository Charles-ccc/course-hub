import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/admin/report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('health')
  health() {
    return this.reportService.getHealthMetrics();
  }

  @Get('gmv')
  gmv(@Query('period') period: string) {
    return this.reportService.getGmvByPeriod(period);
  }

  @Get('overdue-rate')
  overdueRate() {
    return this.reportService.getOverdueRate();
  }
}
