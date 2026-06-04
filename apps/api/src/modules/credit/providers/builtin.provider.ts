import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class BuiltInCreditProvider {
  readonly name = 'builtin';

  constructor(private prisma: PrismaService) {}

  isEnabled(): boolean {
    return true;
  }

  async createAuthorization(ctx: { studentId: string; orderId: string; merchantId: string; scenario: string }) {
    return { authToken: `builtin_${ctx.studentId}_${Date.now()}` };
  }

  async evaluateScenario(authToken: string, scenario: string) {
    // 内置风控：仅使用合法采集数据（平台行为、履约记录），不含第三方征信分
    const studentId = authToken.split('_')[1];
    const orderCount = await this.prisma.order.count({ where: { studentId } });
    const overdueCount = await this.prisma.installmentItem.count({
      where: { order: { studentId }, status: 'OVERDUE' },
    });

    const eligible = overdueCount === 0;
    const riskTier = overdueCount > 2 ? 'C' : orderCount > 3 ? 'A' : 'B';

    return {
      eligible,
      riskTier: riskTier as 'A' | 'B' | 'C',
      suggestedLimit: eligible ? 500000 : 0,
      providerRef: `builtin_${Date.now()}`,
    };
  }

  async signCreditAgreement(studentId: string, plan: { orderId: string; amount: number }) {
    return { agreementNo: `BA-${Date.now()}`, provider: 'builtin' };
  }
}
