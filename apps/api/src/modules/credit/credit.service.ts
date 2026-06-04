import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BuiltInCreditProvider } from './providers/builtin.provider';
import { ZhimaCreditProvider } from './providers/zhima.provider';

export type ScenarioCode = 'INSTALLMENT_COURSE' | 'DEPOSIT_FREE_RENT';

@Injectable()
export class CreditService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private builtIn: BuiltInCreditProvider,
    private zhima: ZhimaCreditProvider,
  ) {}

  private getProvider() {
    const zhimaEnabled = this.config.get('ZHIMA_ENABLED') === 'true';
    // 降级：芝麻未开通或异常 → 回退内置风控
    return zhimaEnabled && this.zhima.isEnabled() ? this.zhima : this.builtIn;
  }

  async authorize(studentId: string, orderId: string, scenario: ScenarioCode) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { sellerOrg: true },
    });
    if (!order) throw new BadRequestException('订单不存在');

    // ★ 商户主体校验：必须是机构，不能是平台
    if (!order.sellerOrgId) {
      throw new BadRequestException({ code: 42203, message: '商户主体非机构，拒绝信用授权' });
    }

    const provider = this.getProvider();
    const authResult = await provider.createAuthorization({
      studentId,
      orderId,
      merchantId: order.sellerOrgId, // 机构为商户主体
      scenario,
    });

    await this.prisma.creditAuthorization.create({
      data: {
        studentId,
        provider: provider.name,
        authToken: authResult.authToken,
        status: 'authorized',
      },
    });

    const decision = await provider.evaluateScenario(authResult.authToken, scenario);

    // ★ 不存储原始信用分，只存决策结论
    await this.prisma.creditDecision.create({
      data: {
        orderId,
        provider: provider.name,
        eligible: decision.eligible,
        riskTier: decision.riskTier,
        suggestedLimit: decision.suggestedLimit,
        providerRef: decision.providerRef,
      },
    });

    return decision;
  }

  async getDecision(orderId: string) {
    return this.prisma.creditDecision.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      select: {
        eligible: true,
        riskTier: true,
        suggestedLimit: true,
        provider: true,
        providerRef: true,
        createdAt: true,
        // ★ 无 rawScore 字段
      },
    });
  }

  async signAgreement(studentId: string, orderId: string) {
    const provider = this.getProvider();
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new BadRequestException('订单不存在');

    const result = await provider.signCreditAgreement(studentId, { orderId, amount: order.totalAmount });

    await this.prisma.creditAgreement.create({
      data: {
        orderId,
        provider: provider.name,
        agreementNo: result.agreementNo,
        status: 'signed',
        signedAt: new Date(),
      },
    });

    return result;
  }
}
