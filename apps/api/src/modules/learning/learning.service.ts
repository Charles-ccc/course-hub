import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  async unlockContent(studentId: string, orderId: string, periodNo: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.studentId !== studentId) throw new NotFoundException('订单不存在');
    if (order.status !== 'ACTIVE') throw new BadRequestException('订单未激活');

    const item = await this.prisma.installmentItem.findUnique({
      where: { orderId_periodNo: { orderId, periodNo } },
    });
    if (!item) throw new NotFoundException('分期项不存在');

    // 解锁内容，置位 content_delivered_at（代扣前置条件）
    await this.prisma.installmentItem.update({
      where: { orderId_periodNo: { orderId, periodNo } },
      data: { contentDeliveredAt: new Date(), status: 'DELIVERED' },
    });

    await this.prisma.serviceRecord.create({
      data: {
        orderId,
        type: 'CONTENT_UNLOCK',
        payloadRef: `period_${periodNo}`,
        actorId: order.sellerOrgId,
      },
    });

    return { success: true, periodNo, unlockedAt: new Date() };
  }

  async checkin(studentId: string, dto: { orderId: string; coursePeriod: number; faceToken: string }) {
    // 扫脸比对（调用人脸核身接口，桩实现返回 matched=true）
    const matched = await this.faceMatch(studentId, dto.faceToken);

    const checkin = await this.prisma.learningCheckin.create({
      data: {
        orderId: dto.orderId,
        studentId,
        coursePeriod: dto.coursePeriod,
        faceMatchRef: dto.faceToken,
        matched,
      },
    });

    if (matched) {
      // 发放学习激励（source = 机构）
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (order) {
        await this.prisma.incentive.create({
          data: {
            orderId: dto.orderId,
            sourceOrgId: order.sellerOrgId,
            amount: 500, // 5元，可配置
            status: 'granted',
          },
        });
      }
    }

    return { matched, checkinId: checkin.id };
  }

  async getServiceRecords(orderId: string) {
    return this.prisma.serviceRecord.findMany({
      where: { orderId },
      orderBy: { ts: 'desc' },
    });
  }

  async getProgress(orderId: string) {
    const items = await this.prisma.installmentItem.findMany({
      where: { orderId },
      orderBy: { periodNo: 'asc' },
    });
    const checkins = await this.prisma.learningCheckin.findMany({ where: { orderId } });
    const incentives = await this.prisma.incentive.findMany({ where: { orderId } });

    return { installments: items, checkins, incentives };
  }

  private async faceMatch(studentId: string, faceToken: string): Promise<boolean> {
    // 生产：调用腾讯云人脸核身或 e签宝 API
    return true;
  }
}
