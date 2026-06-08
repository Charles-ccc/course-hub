import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CommissionStatus, CommissionType } from "@prisma/client";

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async createClosingCommission(
    orderId: string,
    staffId: string,
    totalAmount: number,
    rate = 0.03,
  ) {
    // ★ Staff self-buy 防御：自购订单不计提成
    if (await this.isSelfBuy(orderId, staffId)) return;

    await this.prisma.commission.create({
      data: {
        staffId,
        orderId,
        type: CommissionType.CLOSING,
        amount: Math.floor(totalAmount * rate),
        status: CommissionStatus.PENDING,
      },
    });
  }

  async createPerformanceCommission(
    orderId: string,
    staffId: string,
    periodNo: number,
    periodAmount: number,
    rate = 0.01,
  ) {
    if (await this.isSelfBuy(orderId, staffId)) return;

    await this.prisma.commission.create({
      data: {
        staffId,
        orderId,
        type: CommissionType.PERFORMANCE,
        periodNo,
        amount: Math.floor(periodAmount * rate),
        status: CommissionStatus.PENDING,
      },
    });
  }

  /** 判断是否业务员自购：业务员与订单学员同手机号 */
  private async isSelfBuy(orderId: string, staffId: string): Promise<boolean> {
    if (!this.prisma.order?.findUnique || !this.prisma.staff?.findUnique) {
      return false;
    }
    const [order, staff] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id: orderId },
        include: { student: true },
      }),
      this.prisma.staff.findUnique({ where: { id: staffId } }),
    ]);
    const studentPhone = (order as any)?.student?.phone;
    if (!studentPhone || !staff?.phone) return false;
    return studentPhone === staff.phone;
  }

  async settleOnPayment(orderId: string, periodNo: number) {
    // 还款成功 → 解锁当期履约提成
    await this.prisma.commission.updateMany({
      where: {
        orderId,
        periodNo,
        type: CommissionType.PERFORMANCE,
        status: CommissionStatus.HELD,
      },
      data: { status: CommissionStatus.SETTLED },
    });
    // 成单提成 T+1 结算（简化：首期还款触发）
    if (periodNo === 1) {
      await this.prisma.commission.updateMany({
        where: {
          orderId,
          type: CommissionType.CLOSING,
          status: CommissionStatus.PENDING,
        },
        data: { status: CommissionStatus.SETTLED },
      });
    }
  }

  async holdOnOverdue(orderId: string, periodNo: number) {
    await this.prisma.commission.updateMany({
      where: { orderId, periodNo, type: CommissionType.PERFORMANCE },
      data: { status: CommissionStatus.HELD },
    });
  }

  async clawBackIfExtendedOverdue(orderId: string) {
    // 连续逾期 >60 天，按比例扣回成单提成
    await this.prisma.commission.updateMany({
      where: {
        orderId,
        type: CommissionType.CLOSING,
        status: CommissionStatus.SETTLED,
      },
      data: { status: CommissionStatus.CLAWED_BACK },
    });
  }

  async getStaffDashboard(staffId: string) {
    const commissions = await this.prisma.commission.findMany({
      where: { staffId },
      orderBy: { createdAt: "desc" },
    });

    const settled = commissions
      .filter((c) => c.status === CommissionStatus.SETTLED)
      .reduce((s, c) => s + c.amount, 0);
    const pending = commissions
      .filter((c) => c.status === CommissionStatus.PENDING)
      .reduce((s, c) => s + c.amount, 0);
    const held = commissions
      .filter((c) => c.status === CommissionStatus.HELD)
      .reduce((s, c) => s + c.amount, 0);

    return { settled, pending, held, records: commissions };
  }

  async getStaffProfile(staffId: string) {
    return this.prisma.staff.findUnique({ where: { id: staffId } });
  }

  async adminListStaff(page = 1, size = 20) {
    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
        include: {
          _count: { select: { students: true } },
        },
      }),
      this.prisma.staff.count(),
    ]);
    return { items, total, page, size };
  }

  async disableStaff(staffId: string) {
    return this.prisma.staff.update({
      where: { id: staffId },
      data: { status: 'DISABLED' },
    });
  }

  async getStaffStudents(staffId: string, page = 1, tab = 'all') {
    const size = 20;
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const students = await this.prisma.student.findMany({
      where: { referrerStaffId: staffId },
      select: {
        id: true,
        phone: true,
        realname: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            periodCount: true,
            createdAt: true,
            installmentItems: {
              select: {
                periodNo: true,
                status: true,
                dueDate: true,
              },
              orderBy: { periodNo: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // 计算每个学员最新订单的 nextDueDate 和 completedPeriods
    const enriched = students.map((s) => {
      const orders = s.orders.map((o) => {
        const items = o.installmentItems;
        const completedPeriods = items.filter(
          (i) => i.status === 'PAID',
        ).length;
        const nextPending = items
          .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
          .sort((a, b) => a.periodNo - b.periodNo)[0];
        return {
          id: o.id,
          status: o.status,
          totalAmount: o.totalAmount,
          periodCount: o.periodCount,
          completedPeriods,
          nextDueDate: nextPending?.dueDate?.toISOString() ?? null,
          createdAt: o.createdAt,
        };
      });
      return { ...s, orders };
    });

    // tab 过滤（在内存中）
    let filtered = enriched;
    if (tab === 'overdue') {
      filtered = enriched.filter((s) =>
        s.orders.some((o) => o.status === 'OVERDUE'),
      );
    } else if (tab === 'due7') {
      filtered = enriched.filter((s) =>
        s.orders.some((o) => {
          if (!o.nextDueDate) return false;
          const due = new Date(o.nextDueDate);
          return due >= now && due <= sevenDaysLater;
        }),
      );
    } else if (tab === 'due') {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      filtered = enriched.filter((s) =>
        s.orders.some((o) => {
          if (!o.nextDueDate) return false;
          const due = new Date(o.nextDueDate);
          return due >= now && due <= tomorrow;
        }),
      );
    }

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * size, page * size);

    // 脱敏：隐藏姓名中间字
    const masked = paged.map((s) => ({
      ...s,
      realname: s.realname ? s.realname.replace(/(?<=.).(?=.)/, '*') : null,
    }));

    return { items: masked, total, page, size };
  }
}
