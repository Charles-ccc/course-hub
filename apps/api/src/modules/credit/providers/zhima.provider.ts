import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 芝麻先享适配器 — 预留桩实现，默认 enabled=false
 * 接通后商户主体 = 机构（BY_ORG 模式），不接收原始芝麻分
 */
@Injectable()
export class ZhimaCreditProvider {
  readonly name = 'zhima';

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get('ZHIMA_ENABLED') === 'true' && !!this.config.get('ZHIMA_APP_ID');
  }

  async createAuthorization(ctx: { studentId: string; orderId: string; merchantId: string; scenario: string }) {
    // 生产：调用 alipay.user.certify.open.certify，merchant_id = org.alipayMerchantId
    return { authToken: `zhima_mock_${ctx.studentId}` };
  }

  async evaluateScenario(authToken: string, scenario: string) {
    // 生产：调用芝麻先享场景评估接口，返回 eligible/riskTier，不查 zhima.credit.score.get
    return {
      eligible: true,
      riskTier: 'A' as const,
      suggestedLimit: 1000000,
      providerRef: `zhima_${Date.now()}`,
    };
  }

  async signCreditAgreement(studentId: string, plan: { orderId: string; amount: number }) {
    // 生产：调用 zhima.credit.payafteruse.creditagreement.sign
    return { agreementNo: `ZM-${Date.now()}`, provider: 'zhima' };
  }
}
