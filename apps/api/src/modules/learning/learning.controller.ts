import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post(':orderId/unlock')
  unlock(@CurrentUser('id') studentId: string, @Param('orderId') orderId: string, @Body() dto: { periodNo: number }) {
    return this.learningService.unlockContent(studentId, orderId, dto.periodNo);
  }

  @Post('checkin')
  checkin(@CurrentUser('id') studentId: string, @Body() dto: { orderId: string; coursePeriod: number; faceToken: string }) {
    return this.learningService.checkin(studentId, dto);
  }

  @Get(':orderId/records')
  records(@Param('orderId') orderId: string) {
    return this.learningService.getServiceRecords(orderId);
  }

  @Get(':orderId/progress')
  progress(@Param('orderId') orderId: string) {
    return this.learningService.getProgress(orderId);
  }
}
