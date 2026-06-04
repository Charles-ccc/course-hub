import { Controller, Post, Body, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { AlipayLoginDto } from './dto/alipay-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('wechat/login')
  wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto);
  }

  @Post('alipay/login')
  alipayLogin(@Body() dto: AlipayLoginDto) {
    return this.authService.alipayLogin(dto);
  }

  @Post('register')
  register(@Body() dto: any) {
    return this.authService.registerWithAttribution(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: any) {
    return user;
  }

  /** 机构端登录（手机号 + 密码，开发阶段接受任意已注册机构） */
  @Post('org/login')
  async orgLogin(@Body() dto: { phone: string; password: string }) {
    // 生产环境：校验机构账号密码；开发阶段找第一个 ACTIVE 机构或返回 mock
    let org = await this.prisma.org.findFirst({ where: { status: 'ACTIVE' } });

    if (!org) {
      // 若无机构，自动创建一个演示机构
      org = await this.prisma.org.create({
        data: {
          name: '演示机构',
          unifiedCreditCode: 'DEMO000000000000',
          businessLicenseUrl: '',
          eduQualificationUrl: '',
          settlementFeeRate: 0.03,
          status: 'ACTIVE',
        },
      });
    }

    const token = this.jwtService.sign({ sub: org.id, role: 'org', orgId: org.id });
    return { token, orgId: org.id, orgName: org.name };
  }

  /** 平台后台登录（开发阶段固定账号） */
  @Post('admin/login')
  async adminLogin(@Body() dto: { username: string; password: string }) {
    const ADMIN_ACCOUNTS: Record<string, string> = {
      admin: 'admin123',
      ops: 'ops123',
      finance: 'finance123',
    };

    if (!ADMIN_ACCOUNTS[dto.username] || ADMIN_ACCOUNTS[dto.username] !== dto.password) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const roleMap: Record<string, string> = { admin: 'admin', ops: 'ops', finance: 'finance' };
    const token = this.jwtService.sign({ sub: dto.username, role: roleMap[dto.username] });
    return { token, role: roleMap[dto.username], username: dto.username };
  }
}
