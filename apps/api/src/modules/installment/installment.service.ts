import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

@Injectable()
export class InstallmentService {
  constructor(private prisma: PrismaService) {}

  async generateInstallments(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const items = Array.from({ length: order.periodCount }, (_, i) => ({
      orderId,
      periodNo: i + 1,
      dueDate: dayjs().add((i + 1) * 30, 'day').toDate(),
      planAmount: order.periodAmount,
      actualAmount: order.periodAmount,
    }));

    await this.prisma.installmentItem.createMany({ data: items });
  }

  async listByOrder(orderId: string) {
    return this.prisma.installmentItem.findMany({
      where: { orderId },
      orderBy: { periodNo: 'asc' },
    });
  }

  async markContentDelivered(orderId: string, periodNo: number) {
    await this.prisma.installmentItem.update({
      where: { orderId_periodNo: { orderId, periodNo } },
      data: { contentDeliveredAt: new Date(), status: 'DELIVERED' },
    });
  }

  // 每日检测冷静期结束的订单，切换为 active 并生成分期
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async activateCoolingOffOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COOLING_OFF',
        coolingOffDeadline: { lte: new Date() },
      },
    });

    for (const order of orders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'ACTIVE' },
      });
      await this.generateInstallments(order.id);
    }
  }
}
