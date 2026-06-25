import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import type {
  CreateOrderReqDto,
  CreateOrderRespDto,
  OrderDetailDto,
} from "./dto/order.dto";

const INSTALLMENT_INTERVAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly prisma: PrismaService) {}

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
