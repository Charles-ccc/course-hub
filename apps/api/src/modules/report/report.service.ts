import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getHealthMetrics() {
    const [
      totalInstallments,
      paidInstallments,
      overdueInstallments,
      totalOrders,
      refundedOrders,
    ] = await Promise.all([
      this.prisma.installmentItem.count({ where: { status: { in: ['PAID', 'OVERDUE'] } } }),
      this.prisma.installmentItem.count({ where: { status: 'PAID' } }),
      this.prisma.installmentItem.count({ where: { status: 'OVERDUE' } }),
      this.prisma.order.count({ where: { status: { in: ['ACTIVE', 'COMPLETED', 'REFUNDED'] } } }),
      this.prisma.order.count({ where: { status: 'REFUNDED' } }),
    ]);

    const repaymentRate = totalInstallments > 0 ? paidInstallments / totalInstallments : 0;
    const overdueRate = totalInstallments > 0 ? overdueInstallments / totalInstallments : 0;
    const refundRate = totalOrders > 0 ? refundedOrders / totalOrders : 0;

    return {
      repaymentRate: (repaymentRate * 100).toFixed(2) + '%',
      overdueRate: (overdueRate * 100).toFixed(2) + '%',
      refundRate: (refundRate * 100).toFixed(2) + '%',
      healthStatus: {
        repaymentRate: repaymentRate > 0.9 ? 'healthy' : 'warning',
        overdueRate: overdueRate < 0.1 ? 'healthy' : 'warning',
        refundRate: refundRate < 0.05 ? 'healthy' : 'warning',
      },
    };
  }

  async getGmvByPeriod(period: string) {
    const settlements = await this.prisma.settlement.findMany({
      where: { period },
      include: { org: { select: { name: true } } },
    });
    const totalGmv = settlements.reduce((s, r) => s + r.gmv, 0);
    const totalFee = settlements.reduce((s, r) => s + r.platformServiceFee, 0);
    return { period, totalGmv, totalFee, orgs: settlements };
  }

  async getOverdueRate() {
    const orgs = await this.prisma.org.findMany({ where: { status: 'ACTIVE' } });
    const result = await Promise.all(
      orgs.map(async (org) => {
        const total = await this.prisma.installmentItem.count({
          where: { order: { sellerOrgId: org.id }, status: { in: ['PAID', 'OVERDUE'] } },
        });
        const overdue = await this.prisma.installmentItem.count({
          where: { order: { sellerOrgId: org.id }, status: 'OVERDUE' },
        });
        return { orgId: org.id, orgName: org.name, overdueRate: total > 0 ? overdue / total : 0 };
      }),
    );
    return result;
  }
}
