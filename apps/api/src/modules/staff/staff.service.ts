import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Installment } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { buildPageResult } from "../../common/dto/page.dto";
import type {
  StaffCommissionListDto,
  StaffCommissionSummaryDto,
} from "./dto/staff-commission.dto";
import type { StaffCommissionListQueryDto } from "./dto/staff-commission.dto";
import type {
  StaffStudentListDto,
  StaffStudentListQueryDto,
} from "./dto/staff-student.dto";
import type { StaffProfileDto } from "./dto/staff-profile.dto";

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommissionSummary(
    staffId: string,
  ): Promise<StaffCommissionSummaryDto> {
    await this.ensureStaff(staffId, true);

    const grouped = await this.prisma.commission.groupBy({
      by: ["status"],
      where: { staffId },
      _sum: { amountCents: true },
    });

    const summary = {
      settledCents: 0,
      pendingCents: 0,
      heldCents: 0,
    };

    for (const item of grouped) {
      const amount = item._sum.amountCents ?? 0;
      if (item.status === "SETTLED") {
        summary.settledCents += amount;
      }
      if (item.status === "PENDING") {
        summary.pendingCents += amount;
      }
      if (item.status === "HELD") {
        summary.heldCents += amount;
      }
    }

    return summary;
  }

  async getCommissions(
    staffId: string,
    query: StaffCommissionListQueryDto,
  ): Promise<StaffCommissionListDto> {
    await this.ensureStaff(staffId, true);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.commission.count({ where: { staffId } }),
      this.prisma.commission.findMany({
        where: { staffId },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return buildPageResult(
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        periodNo: row.periodNo ?? undefined,
        status: row.status,
        amountCents: row.amountCents,
        studentName: row.studentName,
        courseName: row.courseName,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      query.page,
      query.pageSize,
    );
  }

  async getStudents(
    staffId: string,
    query: StaffStudentListQueryDto,
  ): Promise<StaffStudentListDto> {
    await this.ensureStaff(staffId, true);

    const where = await this.buildStudentWhereByTab(staffId, query.tab);
    if (!where) {
      return buildPageResult([], 0, query.page, query.pageSize);
    }

    const [total, students] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    const studentIds = students.map((item) => item.id);
    if (studentIds.length === 0) {
      return buildPageResult([], total, query.page, query.pageSize);
    }

    const studentsWithOrders = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        orders: {
          include: { installments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const studentMap = new Map(
      studentsWithOrders.map((item) => [item.id, item]),
    );

    const items = students
      .map((student) => {
        const source = studentMap.get(student.id);
        if (!source) {
          return null;
        }

        const flattenedInstallments = source.orders.flatMap(
          (order) => order.installments,
        );
        const nextDueDate = this.findNextDueDate(flattenedInstallments);
        const overdueDays = this.calculateOverdueDays(nextDueDate);
        const status = this.deriveStudentStatus(source.orders, overdueDays);
        const finishedCount = flattenedInstallments.filter((item) =>
          ["PAID", "WRITTEN_OFF"].includes(item.status),
        ).length;

        const payload = {
          id: student.id,
          name: this.maskName(student.name ?? "未实名学员"),
          phone: this.maskPhone(student.phone),
          status,
          progressFinishedCount: finishedCount,
          progressTotalCount: flattenedInstallments.length,
          nextDueDate: nextDueDate?.toISOString(),
          overdueDays,
        };

        return payload;
      })
      .filter((item) => item !== null)
      .map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        status: item.status,
        progressFinishedCount: item.progressFinishedCount,
        progressTotalCount: item.progressTotalCount,
        nextDueDate: item.nextDueDate,
        overdueDays: item.overdueDays,
      }));

    return buildPageResult(items, total, query.page, query.pageSize);
  }

  async getProfile(staffId: string): Promise<StaffProfileDto> {
    const staff = await this.ensureStaff(staffId, false);

    return {
      name: staff.name,
      phone: staff.phone,
      staffId: staff.id,
      contractType: staff.contractType,
      groupName: staff.groupName ?? undefined,
      status: staff.status,
    };
  }

  private async ensureStaff(staffId: string, activeOnly: boolean) {
    const staff = await this.prisma.salesman.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    if (activeOnly && staff.status !== "ACTIVE") {
      throw new ForbiddenException("Staff account is disabled");
    }

    return staff;
  }

  private findNextDueDate(installments: Installment[]): Date | undefined {
    const candidates = installments
      .filter((item) => !["PAID", "WRITTEN_OFF"].includes(item.status))
      .map((item) => item.dueDate)
      .sort((a, b) => a.getTime() - b.getTime());

    return candidates[0];
  }

  private calculateOverdueDays(nextDueDate?: Date): number {
    if (!nextDueDate) {
      return 0;
    }

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const diff = now.getTime() - nextDueDate.getTime();
    if (diff <= 0) {
      return 0;
    }

    return Math.ceil(diff / dayMs);
  }

  private deriveStudentStatus(
    orders: Array<{ status: string }>,
    overdueDays: number,
  ): "ACTIVE" | "COMPLETED" | "OVERDUE" {
    if (overdueDays > 0 || orders.some((item) => item.status === "ACTIVE")) {
      if (overdueDays > 0) {
        return "OVERDUE";
      }
      return "ACTIVE";
    }

    if (
      orders.length > 0 &&
      orders.every((item) => item.status === "COMPLETED")
    ) {
      return "COMPLETED";
    }

    return "ACTIVE";
  }

  private async buildStudentWhereByTab(
    staffId: string,
    tab: "all" | "due7" | "due" | "overdue" | undefined,
  ): Promise<Prisma.StudentWhereInput | null> {
    const currentTab = tab ?? "all";
    if (currentTab === "all") {
      return { boundSalesmanId: staffId };
    }

    if (currentTab === "overdue") {
      const overdueRows = await this.prisma.installment.findMany({
        where: {
          dueDate: {
            lt: new Date(),
          },
          status: {
            notIn: ["PAID", "WRITTEN_OFF"],
          },
          order: {
            studentId: { not: null },
            student: {
              boundSalesmanId: staffId,
            },
          },
        },
        select: {
          order: {
            select: {
              studentId: true,
            },
          },
        },
        distinct: ["orderId"],
      });

      const overdueStudentIds = Array.from(
        new Set(
          overdueRows
            .map((item) => item.order.studentId)
            .filter((item): item is string => typeof item === "string"),
        ),
      );

      if (overdueStudentIds.length === 0) {
        return null;
      }

      return {
        boundSalesmanId: staffId,
        id: { in: overdueStudentIds },
      };
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const startDate =
      currentTab === "due" ? new Date(now - dayMs) : new Date(now);
    const endDate =
      currentTab === "due" ? new Date(now + dayMs) : new Date(now + 7 * dayMs);

    const dueRows = await this.prisma.installment.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ["PAID", "WRITTEN_OFF"],
        },
        order: {
          studentId: { not: null },
          student: {
            boundSalesmanId: staffId,
          },
        },
      },
      select: {
        order: {
          select: {
            studentId: true,
          },
        },
      },
      distinct: ["orderId"],
    });

    const studentIds = Array.from(
      new Set(
        dueRows
          .map((item) => item.order.studentId)
          .filter((item): item is string => typeof item === "string"),
      ),
    );

    if (studentIds.length === 0) {
      return null;
    }

    return {
      boundSalesmanId: staffId,
      id: { in: studentIds },
    };
  }

  private maskName(name: string): string {
    if (!name) {
      return "_";
    }
    return `${name[0]}_`;
  }

  private maskPhone(phone: string): string {
    if (!/^\d{11}$/.test(phone)) {
      return phone;
    }
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }
}
