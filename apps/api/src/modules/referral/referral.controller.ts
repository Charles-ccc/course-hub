import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('invite')
  generateInvite(@CurrentUser('id') studentId: string) {
    return this.referralService.generateInviteLink(studentId);
  }

  @Get('rewards')
  myRewards(@CurrentUser('id') studentId: string) {
    return this.referralService.getMyRewards(studentId);
  }
}
