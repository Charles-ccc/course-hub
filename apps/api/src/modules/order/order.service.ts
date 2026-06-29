import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import { AlipayService } from "../student-auth/alipay.service";
import type {
  CreateOrderReqDto,
  CreateOrderRespDto,
  OrderDetailDto,
  OrderListDto,
  ZhimaInitializeRespDto,
  ZhimaConfirmRespDto,
  RepayRespDto,
} from "./dto/order.dto";

/** 将无连字符的 32 位 hex 还原为标准 UUID（8-4-4-4-12） */
function hex32ToUuid(hex32: string): string | null {
  if (!/^[0-9a-fA-F]{32}$/.test(hex32)) return null;
  return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20)}`;
}

const INSTALLMENT_INTERVAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alipay: AlipayService,
  ) {}

  async create(
    studentId: string,
    dto: CreateOrderReqDto,
  ): Promise<CreateOrderRespDto> {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    const course = await this.prisma.course.findFirst({
      where: {
        id: dto.courseId,
        status: "ONLINE",
        auditStatus: "APPROVED",
      },
      include: { insitution: { select: { name: true } } },
    });
    if (!course) {
      throw new ApiBusinessException(40010, "课程不存在或已下架", 400);
    }

    // 先学后付（分期）受价格上限约束；立即付款不限
    if (dto.payType === "DEFERRED") {
      const config = await this.prisma.systemConfig.findFirst();
      if (config && course.priceCents > config.priceLimitCents) {
        throw new ApiBusinessException(
          40002,
          "该课程暂不支持分期购买",
          400,
        );
      }
    }

    const studentName = student.name ?? student.phone;
    const periodCount =
      dto.payType === "DEFERRED" ? Math.max(course.periodCount, 1) : 1;

    const orderId = randomUUID();
    const now = new Date();

    const installments = this.buildInstallments(
      orderId,
      course.priceCents,
      periodCount,
      dto.payType,
      now,
    );

    await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          id: orderId,
          insitutionId: course.insitutionId,
          studentId: student.id,
          courseId: course.id,
          orgCodeId: student.orgCodeId,
          studentName,
          courseName: course.name,
          totalAmountCents: course.priceCents,
          periodCount,
          payType: dto.payType,
          status: "CREATED",
          createdAt: now,
        },
      }),
      this.prisma.installment.createMany({ data: installments }),
    ]);

    this.logger.log(
      JSON.stringify({
        event: "order_created",
        orderId,
        studentId: student.id,
        courseId: course.id,
        payType: dto.payType,
        periodCount,
      }),
    );

    return { orderId };
  }

  async detail(studentId: string, orderId: string): Promise<OrderDetailDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, studentId },
      include: {
        insitution: { select: { name: true } },
        installments: { orderBy: { periodNo: "asc" } },
      },
    });
    if (!order) {
      throw new ApiBusinessException(40411, "订单不存在", 404);
    }

    return {
      id: order.id,
      courseId: order.courseId,
      courseName: order.courseName,
      insitutionName: order.insitution.name,
      studentName: order.studentName,
      totalAmountCents: order.totalAmountCents,
      periodCount: order.periodCount,
      payType: order.payType,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      installments: order.installments.map((it) => ({
        periodNo: it.periodNo,
        dueDate: it.dueDate.toISOString(),
        plannedAmountCents: it.plannedAmountCents,
        paidAmountCents: it.paidAmountCents,
        status: it.status,
      })),
    };
  }

  async list(studentId: string): Promise<OrderListDto> {
    const orders = await this.prisma.order.findMany({
      where: { studentId },
      include: { insitution: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // 聚合各订单的逾期分期：期数 + 逾期应还总额（守约链接落地后用于列表红标）
    const overdueGroups = await this.prisma.installment.groupBy({
      by: ["orderId"],
      where: { orderId: { in: orders.map((o) => o.id) }, status: "OVERDUE" },
      _count: { _all: true },
      _sum: { plannedAmountCents: true },
    });
    const overdueMap = new Map(
      overdueGroups.map((g) => [
        g.orderId,
        {
          count: g._count._all,
          amountCents: g._sum.plannedAmountCents ?? 0,
        },
      ]),
    );

    return orders.map((o) => {
      const overdue = overdueMap.get(o.id);
      return {
        id: o.id,
        courseId: o.courseId,
        courseName: o.courseName,
        insitutionName: o.insitution.name,
        totalAmountCents: o.totalAmountCents,
        periodCount: o.periodCount,
        payType: o.payType,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        overdueCount: overdue?.count ?? 0,
        overdueAmountCents: overdue?.amountCents ?? 0,
      };
    });
  }

  // ── 芝麻先享 ──────────────────────────────────────────────

  async zhimaInitialize(
    studentId: string,
    orderId: string,
  ): Promise<ZhimaInitializeRespDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, studentId },
    });
    if (!order) throw new ApiBusinessException(40411, "订单不存在", 404);
    if (order.status !== "CREATED") {
      throw new ApiBusinessException(40020, "订单状态不允许发起芝麻先享授权", 400);
    }
    if (order.payType !== "DEFERRED") {
      throw new ApiBusinessException(40021, "仅先学后付订单支持芝麻先享", 400);
    }

    const outOrderNo = orderId.replace(/-/g, "_");
    const firstInstallment = await this.prisma.installment.findFirst({
      where: { orderId, periodNo: 1 },
    });
    const perPeriodAmountCents =
      firstInstallment?.plannedAmountCents ?? Math.floor(order.totalAmountCents / order.periodCount);

    let creditBizOrderId: string;
    let schemeUrl: string;
    try {
      ({ creditBizOrderId, schemeUrl } = await this.alipay.createZhimaCreditOrder({
        outOrderNo,
        totalAmountCents: order.totalAmountCents,
        perPeriodAmountCents,
        periodCount: order.periodCount,
        courseName: order.courseName,
      }));
    } catch (err) {
      const msg = String(err);
      if (msg.includes("ZHIMA_API_UNAVAILABLE")) {
        throw new ApiBusinessException(50101, "芝麻先享服务暂不可用，API 权限申请中，请稍后重试", 501);
      }
      throw err;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { creditBizOrderId },
    });

    this.logger.log(
      JSON.stringify({ event: "zhima_initialize", orderId, creditBizOrderId }),
    );

    return { scheme: schemeUrl };
  }

  async zhimaConfirm(
    studentId: string,
    orderId: string,
  ): Promise<ZhimaConfirmRespDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, studentId },
    });
    if (!order) throw new ApiBusinessException(40411, "订单不存在", 404);
    if (order.status !== "CREATED") {
      return { success: true, orderStatus: order.status };
    }
    if (!order.creditBizOrderId) {
      throw new ApiBusinessException(40022, "尚未发起芝麻先享授权", 400);
    }

    const outOrderNo = orderId.replace(/-/g, "_");
    const { signed } = await this.alipay.queryZhimaCreditOrder({
      outOrderNo,
      creditBizOrderId: order.creditBizOrderId,
    });

    if (!signed) {
      throw new ApiBusinessException(40501, "用户尚未完成芝麻先享授权", 400);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: "ACTIVE" },
    });

    this.logger.log(JSON.stringify({ event: "zhima_confirmed", orderId }));

    return { success: true, orderStatus: "ACTIVE" };
  }

  async handleZhimaNotify(params: Record<string, string>): Promise<void> {
    const valid = this.alipay.verifyNotifySign(params);
    if (!valid) {
      this.logger.warn(JSON.stringify({ event: "zhima_notify_invalid_sign", params }));
      return;
    }

    const outOrderNo = params["out_order_no"] ?? params["outOrderNo"] ?? "";
    const orderId = outOrderNo.replace(/_/g, "-");
    const periodNoStr = params["period_no"] ?? params["periodNo"] ?? "";
    const periodNo = parseInt(periodNoStr, 10);
    const notifyType = params["notify_type"] ?? params["notifyType"] ?? "";

    this.logger.log(
      JSON.stringify({ event: "zhima_notify", orderId, periodNo, notifyType }),
    );

    if (!orderId || !periodNo) return;

    const isSuccess =
      notifyType === "WITHHOLD_SUCCESS" ||
      notifyType === "withhold_success" ||
      params["status"] === "SUCCESS";

    const newStatus = isSuccess ? "PAID" : "OVERDUE";
    const paidAmountCents = isSuccess
      ? Math.round(parseFloat(params["amount"] ?? params["income_amount"] ?? "0") * 100)
      : 0;

    await this.prisma.installment.updateMany({
      where: { orderId, periodNo },
      data: {
        status: newStatus,
        ...(isSuccess ? { paidAmountCents } : {}),
      },
    });

    if (isSuccess) {
      const remaining = await this.prisma.installment.count({
        where: { orderId, status: { not: "PAID" } },
      });
      if (remaining === 0) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED" },
        });
        this.logger.log(JSON.stringify({ event: "order_completed", orderId }));
      }
    }
  }

  async repay(
    studentId: string,
    orderId: string,
    periodNo: number,
  ): Promise<RepayRespDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, studentId },
      include: { student: { select: { alipayOpenId: true } } },
    });
    if (!order) throw new ApiBusinessException(40411, "订单不存在", 404);

    const installment = await this.prisma.installment.findUnique({
      where: { orderId_periodNo: { orderId, periodNo } },
    });
    if (!installment) throw new ApiBusinessException(40412, "分期不存在", 404);
    if (installment.status !== "OVERDUE") {
      throw new ApiBusinessException(40023, "该期次无需还款", 400);
    }

    const outTradeNo = `${orderId.replace(/-/g, "")}_${periodNo}`;
    const subject = `${order.courseName} 第${periodNo}期`;

    const { tradeNo } = await this.alipay.createAlipayTrade({
      outTradeNo,
      totalAmountCents: installment.plannedAmountCents,
      subject,
      buyerOpenId: order.student?.alipayOpenId ?? "",
    });

    this.logger.log(
      JSON.stringify({ event: "repay_trade_created", orderId, periodNo, tradeNo }),
    );

    return { tradeNo };
  }

  /** 普通收单支付回调（逾期履约还款）*/
  async handleTradeNotify(params: Record<string, string>): Promise<void> {
    const valid = this.alipay.verifyNotifySign(params);
    if (!valid) {
      this.logger.warn(JSON.stringify({ event: "trade_notify_invalid_sign", params }));
      return;
    }

    const tradeStatus = params["trade_status"] ?? params["tradeStatus"] ?? "";
    const outTradeNo = params["out_trade_no"] ?? params["outTradeNo"] ?? "";
    const [hex32, periodStr] = outTradeNo.split("_");
    const orderId = hex32ToUuid(hex32 ?? "");
    const periodNo = parseInt(periodStr ?? "", 10);

    this.logger.log(
      JSON.stringify({ event: "trade_notify", orderId, periodNo, tradeStatus }),
    );

    if (!orderId || !periodNo) return;
    if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") return;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const paidAmountCents = Math.round(
      parseFloat(params["total_amount"] ?? params["receipt_amount"] ?? "0") * 100,
    );

    await this.prisma.installment.updateMany({
      where: { orderId, periodNo },
      data: { status: "PAID", paidAmountCents: paidAmountCents || undefined },
    });

    // 逾期履约还款：全部期 PAID → COMPLETED
    {
      const remaining = await this.prisma.installment.count({
        where: { orderId, status: { not: "PAID" } },
      });
      if (remaining === 0) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED" },
        });
        this.logger.log(JSON.stringify({ event: "order_completed", orderId }));
      }
    }
  }

  // ── 分期明细生成 ────────────────────────────────────────

  /**
   * 生成分期明细。
   * - IMMEDIATE：1 期全额，dueDate = 下单时间
   * - DEFERRED：N 期，每期金额向下取整均分，末期吸收余数；
   *   第 k 期 dueDate = createdAt + k × 30 天（k 从 1 开始）
   */
  private buildInstallments(
    orderId: string,
    totalCents: number,
    periodCount: number,
    payType: "IMMEDIATE" | "DEFERRED",
    createdAt: Date,
  ): {
    id: string;
    orderId: string;
    periodNo: number;
    dueDate: Date;
    plannedAmountCents: number;
    status: "PENDING";
  }[] {
    if (payType === "IMMEDIATE" || periodCount <= 1) {
      return [
        {
          id: randomUUID(),
          orderId,
          periodNo: 1,
          dueDate: createdAt,
          plannedAmountCents: totalCents,
          status: "PENDING",
        },
      ];
    }

    const base = Math.floor(totalCents / periodCount);
    const result = [];
    let allocated = 0;
    for (let k = 1; k <= periodCount; k++) {
      const isLast = k === periodCount;
      const amount = isLast ? totalCents - allocated : base;
      allocated += amount;
      result.push({
        id: randomUUID(),
        orderId,
        periodNo: k,
        dueDate: new Date(createdAt.getTime() + k * INSTALLMENT_INTERVAL_DAYS * DAY_MS),
        plannedAmountCents: amount,
        status: "PENDING" as const,
      });
    }
    return result;
  }
}
