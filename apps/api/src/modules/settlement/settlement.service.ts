import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

@Injectable()
export class SettlementService {
  constructor(private prisma: PrismaService) {}

  async getOrgSettlements(orgId: string) {
    return this.prisma.settlement.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminList(page = 1) {
    const size = 20;
    const [items, total] = await Promise.all([
      this.prisma.settlement.findMany({
        include: { org: { select: { name: true } } },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.settlement.count(),
    ]);
    return { items, total, page, size };
  }

  async settle(id: string) {
    return this.prisma.settlement.update({
      where: { id },
      data: { status: 'SETTLED' },
    });
  }

  // 每月1日自动生成上月结算单
  @Cron('0 0 1 * *')
  async generateMonthlySettlements() {
    const period = dayjs().subtract(1, 'month').format('YYYY-MM');
    const orgs = await this.prisma.org.findMany({ where: { status: 'ACTIVE' } });

    for (const org of orgs) {
      const start = dayjs(period).startOf('month').toDate();
      const end = dayjs(period).endOf('month').toDate();

      const deductions = await this.prisma.deduction.findMany({
        where: {
          payeeOrgId: org.id,
          status: 'SUCCESS',
          createdAt: { gte: start, lte: end },
        },
      });

      const gmv = deductions.reduce((s, d) => s + d.amount, 0);
      const fee = Math.floor(gmv * Number(org.settlementFeeRate));

      if (gmv > 0) {
        await this.prisma.settlement.create({
          data: { orgId: org.id, period, gmv, platformServiceFee: fee, status: 'PENDING' },
        });
      }
    }
  }
}
