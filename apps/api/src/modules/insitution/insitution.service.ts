import { Injectable, NotFoundException } from "@nestjs/common";
import {
  type CourseDto,
  type CourseStatus,
  type CreateCourseReqDto,
} from "./dto/course.dto";
import type { InsitutionDepositDto } from "./dto/deposit.dto";
import { type OrderDto, type OrderStatus } from "./dto/order.dto";
import type { OverduePeriodDto } from "./dto/overdue.dto";
import type {
  InsitutionQuestionQueryDto,
  QaQuestionDto,
} from "./dto/question.dto";
import type { SettlementRecordDto } from "./dto/settlement.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";

@Injectable()
export class InsitutionService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeposit(userId: string): Promise<InsitutionDepositDto> {
    const user = await this.getCurrentUser(userId);

    return {
      orgId: user.insitution.id,
      orgName: user.insitution.name,
      settlementRate: Number(user.insitution.settlementRate),
      depositBalanceCents: user.insitution.depositBalanceCents,
    };
  }

  async getOrders(userId: string, status?: OrderStatus): Promise<OrderDto[]> {
    const user = await this.getCurrentUser(userId);
    const orders = await this.prisma.order.findMany({
      where: {
        insitutionId: user.insitutionId,
        status,
      },
      include: { installments: { orderBy: { periodNo: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((item) => ({
      id: item.id,
      studentName: item.studentName,
      courseName: item.courseName,
      totalAmountCents: item.totalAmountCents,
      periodCount: item.periodCount,
      status: item.status,
      coolingOffEndAt: item.coolingOffEndAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      installments: item.installments.map((installment) => ({
        id: installment.id,
        periodNo: installment.periodNo,
        dueDate: installment.dueDate.toISOString(),
        plannedAmountCents: installment.plannedAmountCents,
        paidAmountCents: installment.paidAmountCents,
        contentDeliveredAt: installment.contentDeliveredAt?.toISOString(),
        status: installment.status,
      })),
    }));
  }

  async getCourses(userId: string): Promise<CourseDto[]> {
    const user = await this.getCurrentUser(userId);
    const courses = await this.prisma.course.findMany({
      where: { insitutionId: user.insitutionId },
      orderBy: { createdAt: "desc" },
    });

    return courses.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      instructorInfo: item.instructorInfo,
      priceCents: item.priceCents,
      periodCount: item.periodCount,
      status: item.status,
    }));
  }

  async createCourse(
    userId: string,
    payload: CreateCourseReqDto,
  ): Promise<void> {
    const [user, config] = await Promise.all([
      this.getCurrentUser(userId),
      this.getSystemConfig(),
    ]);

    if (payload.priceCents > config.priceLimitCents) {
      throw new ApiBusinessException(
        40002,
        "课程定价超出平台允许的最高金额，请调低定价后重试。",
      );
    }

    await this.prisma.course.create({
      data: {
        id: `course-${Date.now()}`,
        insitutionId: user.insitutionId,
        name: payload.name,
        description: payload.description,
        instructorInfo: payload.instructorInfo,
        priceCents: payload.priceCents,
        periodCount: payload.periodCount,
        status: "OFFLINE",
        auditStatus: "APPROVED",
      },
    });
  }

  async updateCourseStatus(
    userId: string,
    courseId: string,
    status: CourseStatus,
  ): Promise<void> {
    const user = await this.getCurrentUser(userId);
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, insitutionId: user.insitutionId },
    });
    if (!course) {
      throw new NotFoundException("Course not found");
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: { status },
    });
  }

  async getOverdues(userId: string): Promise<OverduePeriodDto[]> {
    const user = await this.getCurrentUser(userId);
    const overdues = await this.prisma.installment.findMany({
      where: {
        status: "OVERDUE",
        order: { insitutionId: user.insitutionId },
      },
      include: { order: true },
      orderBy: { dueDate: "asc" },
    });

    return overdues.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      studentName: item.order.studentName,
      courseName: item.order.courseName,
      periodNo: item.periodNo,
      dueDate: item.dueDate.toISOString(),
      plannedAmountCents: item.plannedAmountCents,
      status: item.status as "OVERDUE" | "WRITTEN_OFF",
    }));
  }

  async writeoffOverdue(userId: string, id: string): Promise<void> {
    const user = await this.getCurrentUser(userId);
    const overdue = await this.prisma.installment.findFirst({
      where: {
        id,
        order: { insitutionId: user.insitutionId },
      },
    });
    if (!overdue) {
      throw new NotFoundException("Overdue period not found");
    }

    await this.prisma.installment.update({
      where: { id },
      data: { status: "WRITTEN_OFF" },
    });
  }

  async getSettlements(userId: string): Promise<SettlementRecordDto[]> {
    const user = await this.getCurrentUser(userId);
    const settlements = await this.prisma.settlementRecord.findMany({
      where: { insitutionId: user.insitutionId },
      orderBy: { period: "desc" },
    });

    return settlements.map((item) => ({
      id: item.id,
      period: item.period,
      gmvCents: item.gmvCents,
      serviceFeeCents: item.serviceFeeCents,
      status: item.status,
      settledAt: item.settledAt?.toISOString(),
    }));
  }

  async getQuestions(
    userId: string,
    query: InsitutionQuestionQueryDto,
  ): Promise<QaQuestionDto[]> {
    const user = await this.getCurrentUser(userId);
    const onlyPending = query.onlyPending === "true";
    const questions = await this.prisma.question.findMany({
      where: {
        insitutionId: user.insitutionId,
        replied: onlyPending ? false : undefined,
      },
      orderBy: { askedAt: "desc" },
    });

    return questions.map((item) => ({
      id: item.id,
      studentName: item.studentName,
      content: item.content,
      askedAt: item.askedAt.toISOString(),
      replied: item.replied,
      replyContent: item.replyContent ?? undefined,
      repliedAt: item.repliedAt?.toISOString(),
    }));
  }

  async replyQuestion(
    userId: string,
    id: string,
    content: string,
  ): Promise<void> {
    const user = await this.getCurrentUser(userId);
    const question = await this.prisma.question.findFirst({
      where: { id, insitutionId: user.insitutionId },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    await this.prisma.question.update({
      where: { id },
      data: {
        replied: true,
        replyContent: content,
        repliedAt: new Date(),
      },
    });
  }

  private async getCurrentUser(userId: string) {
    const user = await this.prisma.insitutionUser.findUnique({
      where: { id: userId },
      include: { insitution: true },
    });

    if (!user) {
      throw new NotFoundException("Insitution user not found");
    }

    return user;
  }

  private async getSystemConfig() {
    return this.prisma.systemConfig.upsert({
      where: { key: "default" },
      create: {
        key: "default",
        priceLimitCents: 200000,
        minAge: 8,
        maxAge: 18,
        zhimaEnabled: true,
      },
      update: {},
    });
  }
}
