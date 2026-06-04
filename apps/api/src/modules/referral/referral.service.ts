import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

const REWARD_AMOUNT = 5000; // 50元，单位分
const TAX_RATE = 0.2; // 个税 20%

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  generateInviteLink(studentId: string) {
    const base = process.env.MINIAPP_SHARE_URL || "https://mp.wangke.com";
    return { link: `${base}/register?inv=${studentId}`, studentId };
  }

  async triggerReward(inviteeStudentId: string, orderId: string) {
    const invitee = await this.prisma.student.findUnique({
      where: { id: inviteeStudentId },
    });
    if (!invitee?.referrerStudentId) return;

    // ★ 多级硬拒绝：邀请人不能同时是业务员（业务员走 commission 通道，不走学员拉新）
    if (await this.inviterIsAlsoStaff(invitee.referrerStudentId)) return;

    // 防刷：同一被邀请人 + 同一订单只奖励一次
    const existing = await this.prisma.referralReward.findFirst({
      where: { inviteeStudentId, orderId },
    });
    if (existing) return;

    const gross = REWARD_AMOUNT;
    const taxWithheld = Math.floor(gross * TAX_RATE);
    const net = gross - taxWithheld;

    await this.prisma.referralReward.create({
      data: {
        inviterStudentId: invitee.referrerStudentId,
        inviteeStudentId,
        orderId,
        grossAmount: gross,
        taxWithheld,
        netAmount: net,
        status: "PENDING",
        trigger: "invitee_first_repayment",
      },
    });
  }

  /** 邀请人手机号若同时存在于 Staff 表 → 视为业务员，禁止学员拉新奖励 */
  private async inviterIsAlsoStaff(inviterStudentId: string): Promise<boolean> {
    if (!this.prisma.staff?.findUnique) return false;
    const inviter = await this.prisma.student.findUnique({
      where: { id: inviterStudentId },
      select: { phone: true },
    });
    if (!inviter?.phone) return false;
    const staff = await this.prisma.staff.findUnique({
      where: { phone: inviter.phone },
    });
    return !!staff;
  }

  async getMyRewards(studentId: string) {
    return this.prisma.referralReward.findMany({
      where: { inviterStudentId: studentId },
      orderBy: { createdAt: "desc" },
    });
  }
}
