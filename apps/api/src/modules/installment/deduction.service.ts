import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PaymentChannel, DeductionStatus } from "@prisma/client";
import * as dayjs from "dayjs";

@Injectable()
export class DeductionService {
  constructor(private prisma: PrismaService) {}

  async triggerDeduction(installmentItemId: string) {
    const item = await this.prisma.installmentItem.findUnique({
      where: { id: installmentItemId },
      include: { order: { include: { sellerOrg: true } } },
    });

    if (!item) throw new BadRequestException("分期项不存在");

    // ★ 合规前置校验：必须先交付后扣款
    if (!item.contentDeliveredAt) {
      throw new BadRequestException({
        code: 42201,
        message: "代扣前置校验失败：当期内容未交付",
      });
    }

    if (item.status === "PAID") {
      return { message: "已支付，无需重复扣款" };
    }

    // 按优先级尝试各通道：微信支付分 → 芝麻 → 银行卡
    const channels: PaymentChannel[] = [
      PaymentChannel.WECHAT_SCORE,
      PaymentChannel.ZHIMA,
      PaymentChannel.BANKCARD,
    ];

    for (const channel of channels) {
      try {
        await this.executeDeduction(item, channel);
        return { success: true, channel };
      } catch (e) {
        continue;
      }
    }

    // 所有通道失败，记录代扣失败
    await this.recordDeductionFailure(item);
    throw new BadRequestException("代扣失败，已进入重试流程");
  }

  private async executeDeduction(item: any, channel: PaymentChannel) {
    const deduction = await this.prisma.deduction.create({
      data: {
        orderId: item.orderId,
        periodNo: item.periodNo,
        installmentItemId: item.id,
        payeeOrgId: item.order.sellerOrgId, // ★ 收款方 = 机构
        channel,
        amount: item.actualAmount,
        status: DeductionStatus.PENDING,
      },
    });

    // 调用对应通道的代扣接口（桩实现）
    const success = await this.callPaymentChannel(
      channel,
      item.order.sellerOrgId,
      item.actualAmount,
    );

    if (!success) {
      await this.prisma.deduction.update({
        where: { id: deduction.id },
        data: { status: DeductionStatus.FAILED },
      });
      throw new Error(`通道 ${channel} 代扣失败`);
    }

    await this.prisma.deduction.update({
      where: { id: deduction.id },
      data: { status: DeductionStatus.SUCCESS },
    });

    await this.prisma.installmentItem.update({
      where: { id: item.id },
      data: { status: "PAID", deductedAmount: item.actualAmount },
    });
  }

  private async callPaymentChannel(
    channel: PaymentChannel,
    merchantId: string,
    amount: number,
  ): Promise<boolean> {
    // 生产环境接入易宝/微信支付分/芝麻信用实际接口
    return true;
  }

  // 失败处理：尝试满 D+7 仍失败才落定为 OVERDUE，否则保留 DELIVERED 等待重试
  private async recordDeductionFailure(item: any) {
    const failedCount =
      (await this.prisma.deduction?.count?.({
        where: { installmentItemId: item.id, status: DeductionStatus.FAILED },
      })) ?? 0;

    // 首扣 + D+1 + D+3 + D+7 共 4 次都失败 → 落定为 OVERDUE
    if (failedCount >= 4) {
      await this.prisma.installmentItem.update({
        where: { id: item.id },
        data: { status: "OVERDUE" },
      });
    }
    // 否则保留 DELIVERED，等下一次 retryOverdueDeductions 命中重试窗口
  }

  // 每日 9:00 触发当日到期分期的首次代扣
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runDailyDeductions() {
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const items = await this.prisma.installmentItem.findMany({
      where: {
        status: "DELIVERED",
        dueDate: { gte: todayStart, lte: todayEnd },
      },
    });

    for (const item of items) {
      await this.triggerDeduction(item.id).catch(() => {});
    }
  }

  /**
   * 每日 10:00 扫描已过期但仍未支付的分期项，按 D+1 / D+3 / D+7 重试窗口发起重扣
   * - 不依赖真实支付通道：callPaymentChannel 仍是桩，等接通后整条链路自然生效
   * - 满 3 次重试（即 D+7）仍失败 → recordDeductionFailure 中落定 OVERDUE
   */
  @Cron("0 10 * * *")
  async retryOverdueDeductions() {
    const today = dayjs().startOf("day");
    const items = await this.prisma.installmentItem.findMany({
      where: {
        status: "DELIVERED",
        dueDate: { lt: today.toDate() },
      },
    });

    for (const item of items) {
      const daysOverdue = today.diff(dayjs(item.dueDate).startOf("day"), "day");
      if (![1, 3, 7].includes(daysOverdue)) continue;
      await this.triggerDeduction(item.id).catch(() => {});
    }
  }
}
