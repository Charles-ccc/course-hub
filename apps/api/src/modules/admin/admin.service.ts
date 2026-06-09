import { Injectable, NotFoundException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import type { LoginRespDto } from "./dto/admin-auth.dto";
import type { DashboardHealthDto } from "./dto/dashboard.dto";
import type {
  AdminCourseDto,
  AdminCourseQueryDto,
  CourseAuditStatus,
} from "./dto/course.dto";
import type {
  ApproveInstitutionReqDto,
  InstitutionDto,
  InstitutionStatus,
  SuspendInstitutionReqDto,
} from "./dto/institution.dto";
import type {
  GmvReportDto,
  GmvReportQueryDto,
  OverdueMonitorDto,
} from "./dto/report.dto";
import type {
  CreateSalesmanReqDto,
  SalesmanDto,
  SalesmanStatus,
} from "./dto/salesman.dto";
import type {
  SettlementQueryDto,
  SettlementRecordDto,
} from "./dto/settlement.dto";
import type {
  SystemConfigDto,
  UpdateSystemConfigReqDto,
} from "./dto/system-config.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import { TokenService } from "../../common/auth/token.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async login(username: string, password: string): Promise<LoginRespDto> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new ApiBusinessException(40001, "用户名或密码错误", 401);
    }

    const passwordMatched = await compare(password, admin.passwordHash);
    if (!passwordMatched) {
      throw new ApiBusinessException(40001, "用户名或密码错误", 401);
    }

    const tokenPair = await this.tokenService.issueTokenPair({
      userId: admin.id,
      role: "PLATFORM_ADMIN",
      refreshOwner: { adminUserId: admin.id },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      role: "PLATFORM_ADMIN",
      userId: admin.id,
      displayName: admin.displayName,
    };
  }

  async refreshToken(refreshToken: string): Promise<LoginRespDto> {
    const refreshed = await this.tokenService.refreshAccessToken(
      refreshToken,
      "PLATFORM_ADMIN",
    );
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: refreshed.user.subject },
    });
    if (!admin) {
      throw new NotFoundException("Admin user not found");
    }

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresIn: refreshed.expiresIn,
      role: "PLATFORM_ADMIN",
      userId: admin.id,
      displayName: admin.displayName,
    };
  }

  async getHealth(): Promise<DashboardHealthDto> {
    const [
      orderAggregate,
      totalOrderCount,
      activeOrderCount,
      refundedOrderCount,
      totalInstallments,
      overdueInstallments,
      paidInstallments,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        _sum: { totalAmountCents: true },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: "ACTIVE" } }),
      this.prisma.order.count({ where: { status: "REFUNDED" } }),
      this.prisma.installment.count(),
      this.prisma.installment.count({ where: { status: "OVERDUE" } }),
      this.prisma.installment.count({ where: { status: "PAID" } }),
    ]);

    const repaymentRate = this.toPercent(paidInstallments, totalInstallments);
    const overdueRate = this.toPercent(overdueInstallments, totalInstallments);
    const refundRate = this.toPercent(refundedOrderCount, totalOrderCount);
    const warningMetrics: DashboardHealthDto["warningMetrics"] = [];

    if (repaymentRate < 95) {
      warningMetrics.push("REPAYMENT_RATE");
    }
    if (overdueRate > 3) {
      warningMetrics.push("OVERDUE_RATE");
    }
    if (refundRate > 2) {
      warningMetrics.push("REFUND_RATE");
    }

    return {
      totalGmvCents: orderAggregate._sum.totalAmountCents ?? 0,
      activeOrderCount,
      repaymentRate,
      overdueRate,
      refundRate,
      status: warningMetrics.length > 0 ? "WARNING" : "HEALTHY",
      warningMetrics,
    };
  }

  async getInstitutions(status?: InstitutionStatus): Promise<InstitutionDto[]> {
    const institutions = await this.prisma.institution.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return institutions.map((item) => ({
      id: item.id,
      name: item.name,
      socialCreditCode: item.socialCreditCode,
      settlementRate: Number(item.settlementRate),
      depositBalanceCents: item.depositBalanceCents,
      cumulativeGmvCents: item.cumulativeGmvCents,
      cumulativeServiceFeeCents: item.cumulativeServiceFeeCents,
      status: item.status,
    }));
  }

  async approveInstitution(
    id: string,
    payload: ApproveInstitutionReqDto,
  ): Promise<void> {
    await this.ensureInstitutionExists(id);
    await this.prisma.institution.update({
      where: { id },
      data: { settlementRate: payload.settlementRate, status: "ACTIVE" },
    });
  }

  async suspendInstitution(
    id: string,
    _payload: SuspendInstitutionReqDto,
  ): Promise<void> {
    await this.ensureInstitutionExists(id);
    await this.prisma.institution.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });
  }

  async getCourses(query: AdminCourseQueryDto): Promise<AdminCourseDto[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        auditStatus: query.auditStatus,
        institutionId: query.institutionId,
      },
      include: { institution: true },
      orderBy: { createdAt: "desc" },
    });

    return courses.map((item) => ({
      id: item.id,
      institutionId: item.institutionId,
      institutionName: item.institution.name,
      name: item.name,
      priceCents: item.priceCents,
      status: item.status,
      auditStatus: item.auditStatus,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async approveCourse(id: string): Promise<void> {
    await this.updateCourseReview(id, "APPROVED");
  }

  async rejectCourse(id: string): Promise<void> {
    await this.updateCourseReview(id, "REJECTED");
  }

  async offlineCourse(id: string): Promise<void> {
    await this.ensureCourseExists(id);
    await this.prisma.course.update({
      where: { id },
      data: { status: "OFFLINE" },
    });
  }

  async getSalesmen(status?: SalesmanStatus): Promise<SalesmanDto[]> {
    const salesmen = await this.prisma.salesman.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return salesmen.map((item) => ({
      id: item.id,
      institutionId: item.institutionId,
      name: item.name,
      phone: item.phone,
      contractType: item.contractType,
      status: item.status,
      studentCount: item.studentCount,
      cumulativeCommissionCents: item.cumulativeCommissionCents,
    }));
  }

  async createSalesman(payload: CreateSalesmanReqDto): Promise<void> {
    await this.ensureInstitutionExists(payload.institutionId);

    await this.prisma.salesman.create({
      data: {
        id: `sales-${Date.now()}`,
        institutionId: payload.institutionId,
        username: payload.username,
        passwordHash: await hash(payload.password, 10),
        name: payload.name,
        phone: payload.phone,
        contractType: payload.contractType,
        status: "ACTIVE",
      },
    });
  }

  async disableSalesman(id: string): Promise<void> {
    await this.ensureSalesmanExists(id);
    await this.prisma.salesman.update({
      where: { id },
      data: { status: "DISABLED" },
    });
  }

  async getGmvReport(query: GmvReportQueryDto): Promise<GmvReportDto> {
    const defaultMonth = query.month ?? new Date().toISOString().slice(0, 7);
    const settlements = await this.prisma.settlementRecord.findMany({
      where: { period: defaultMonth },
      include: { institution: true },
      orderBy: { institutionId: "asc" },
    });

    return {
      month: defaultMonth,
      totalGmvCents: settlements.reduce((sum, item) => sum + item.gmvCents, 0),
      totalServiceFeeCents: settlements.reduce(
        (sum, item) => sum + item.serviceFeeCents,
        0,
      ),
      items: settlements.map((item) => ({
        institutionId: item.institutionId,
        institutionName: item.institution.name,
        gmvCents: item.gmvCents,
        serviceFeeCents: item.serviceFeeCents,
      })),
    };
  }

  async getOverdueMonitor(): Promise<OverdueMonitorDto> {
    const [overdueInstallments, totalInstallments] =
      await this.prisma.$transaction([
        this.prisma.installment.count({ where: { status: "OVERDUE" } }),
        this.prisma.installment.count(),
      ]);

    return {
      overdueRate: this.toPercent(overdueInstallments, totalInstallments),
      overdueInstallments,
      totalInstallments,
    };
  }

  async getSettlements(
    query: SettlementQueryDto,
  ): Promise<SettlementRecordDto[]> {
    const settlements = await this.prisma.settlementRecord.findMany({
      where: {
        period: query.period,
        status: query.status,
      },
      include: { institution: true },
      orderBy: [{ period: "desc" }, { institutionId: "asc" }],
    });

    return settlements.map((item) => ({
      id: item.id,
      institutionId: item.institutionId,
      institutionName: item.institution.name,
      period: item.period,
      gmvCents: item.gmvCents,
      serviceFeeCents: item.serviceFeeCents,
      status: item.status,
      settledAt: item.settledAt?.toISOString(),
    }));
  }

  async executeSettlement(id: string): Promise<void> {
    const settlement = await this.prisma.settlementRecord.findUnique({
      where: { id },
    });
    if (!settlement) {
      throw new NotFoundException("Settlement not found");
    }

    await this.prisma.$transaction([
      this.prisma.settlementRecord.update({
        where: { id },
        data: { status: "SETTLED", settledAt: new Date() },
      }),
      this.prisma.institution.update({
        where: { id: settlement.institutionId },
        data: {
          depositBalanceCents: {
            increment: settlement.gmvCents - settlement.serviceFeeCents,
          },
        },
      }),
    ]);
  }

  async getSystemConfig(): Promise<SystemConfigDto> {
    return this.mapSystemConfig(await this.ensureSystemConfig());
  }

  async updateSystemConfig(
    payload: UpdateSystemConfigReqDto,
  ): Promise<SystemConfigDto> {
    const config = await this.prisma.systemConfig.upsert({
      where: { key: "default" },
      create: { key: "default", ...payload },
      update: payload,
    });

    return this.mapSystemConfig(config);
  }

  private async updateCourseReview(
    id: string,
    auditStatus: CourseAuditStatus,
  ): Promise<void> {
    await this.ensureCourseExists(id);
    await this.prisma.course.update({
      where: { id },
      data: {
        auditStatus,
        status: auditStatus === "APPROVED" ? "ONLINE" : "OFFLINE",
      },
    });
  }

  private async ensureInstitutionExists(id: string): Promise<void> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });
    if (!institution) {
      throw new NotFoundException("Institution not found");
    }
  }

  private async ensureCourseExists(id: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
  }

  private async ensureSalesmanExists(id: string): Promise<void> {
    const salesman = await this.prisma.salesman.findUnique({ where: { id } });
    if (!salesman) {
      throw new NotFoundException("Salesman not found");
    }
  }

  private async ensureSystemConfig() {
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

  private mapSystemConfig(config: {
    priceLimitCents: number;
    minAge: number;
    maxAge: number;
    zhimaEnabled: boolean;
  }): SystemConfigDto {
    return {
      priceLimitCents: config.priceLimitCents,
      minAge: config.minAge,
      maxAge: config.maxAge,
      zhimaEnabled: config.zhimaEnabled,
    };
  }

  private toPercent(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }

    return Number(((numerator / denominator) * 100).toFixed(1));
  }
}
