import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { RealnameDto } from './dto/realname.dto';
import { FaceVerifyDto } from './dto/face-verify.dto';
import { BindPhoneDto } from './dto/bind-phone.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('realname')
  realname(@CurrentUser('id') userId: string, @Body() dto: RealnameDto) {
    return this.userService.verifyRealname(userId, dto);
  }

  @Post('face-verify')
  faceVerify(@CurrentUser('id') userId: string, @Body() dto: FaceVerifyDto) {
    return this.userService.faceVerify(userId, dto);
  }

  @Post('bind-phone')
  bindPhone(@CurrentUser('id') userId: string, @Body() dto: BindPhoneDto) {
    return this.userService.bindPhone(userId, dto);
  }

  @Get('profile')
  profile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Get('referral-link')
  referralLink(@CurrentUser('id') userId: string) {
    return this.userService.generateReferralLink(userId);
  }
}
