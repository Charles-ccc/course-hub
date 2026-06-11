import type {
  AdminCourse,
  AuthSession,
  GmvReport,
  HealthMetrics,
  Insitution,
  OverdueMonitor,
  Salesman,
  SettlementRecord,
  SystemConfig,
} from "../types/domain";
import type {
  AdminCourseDto,
  DashboardHealthDto,
  GmvReportDto,
  LoginResponseDto,
  InsitutionDto,
  OverdueMonitorDto,
  SalesmanDto,
  SettlementRecordDto,
  SystemConfigDto,
} from "../types/api";

export const adaptLoginResponse = (dto: LoginResponseDto): AuthSession => ({
  token: dto.accessToken,
  refreshToken: dto.refreshToken ?? "",
  role: dto.role,
  username: dto.displayName,
});

export const adaptHealthMetrics = (dto: DashboardHealthDto): HealthMetrics => ({
  totalGmvCents: dto.totalGmvCents,
  activeOrderCount: dto.activeOrderCount,
  repaymentRate: dto.repaymentRate,
  overdueRate: dto.overdueRate,
  refundRate: dto.refundRate,
  status: dto.status,
  warningMetrics: dto.warningMetrics,
});

export const adaptInsitution = (dto: InsitutionDto): Insitution => ({
  id: dto.id,
  name: dto.name,
  socialCreditCode: dto.socialCreditCode,
  settlementRate: dto.settlementRate,
  depositBalanceCents: dto.depositBalanceCents,
  cumulativeGmvCents: dto.cumulativeGmvCents,
  cumulativeServiceFeeCents: dto.cumulativeServiceFeeCents,
  status: dto.status,
});

export const adaptCourse = (dto: AdminCourseDto): AdminCourse => ({
  id: dto.id,
  insitutionId: dto.insitutionId,
  insitutionName: dto.insitutionName,
  name: dto.name,
  description: dto.description,
  instructorInfo: dto.instructorInfo,
  priceCents: dto.priceCents,
  periodCount: dto.periodCount,
  status: dto.status,
  auditStatus: dto.auditStatus,
  createdAt: dto.createdAt,
});

export const adaptSalesman = (dto: SalesmanDto): Salesman => ({
  id: dto.id,
  insitutionId: dto.insitutionId,
  name: dto.name,
  phone: dto.phone,
  contractType: dto.contractType,
  status: dto.status,
  studentCount: dto.studentCount,
  cumulativeCommissionCents: dto.cumulativeCommissionCents,
});

export const adaptGmvReport = (dto: GmvReportDto): GmvReport => ({
  month: dto.month,
  totalGmvCents: dto.totalGmvCents,
  totalServiceFeeCents: dto.totalServiceFeeCents,
  items: dto.items,
});

export const adaptOverdueMonitor = (
  dto: OverdueMonitorDto,
): OverdueMonitor => ({
  overdueRate: dto.overdueRate,
  overdueInstallments: dto.overdueInstallments,
  totalInstallments: dto.totalInstallments,
});

export const adaptSettlement = (
  dto: SettlementRecordDto,
): SettlementRecord => ({
  id: dto.id,
  insitutionId: dto.insitutionId,
  insitutionName: dto.insitutionName,
  period: dto.period,
  gmvCents: dto.gmvCents,
  serviceFeeCents: dto.serviceFeeCents,
  status: dto.status,
  settledAt: dto.settledAt,
});

export const adaptSystemConfig = (dto: SystemConfigDto): SystemConfig => ({
  priceLimitCents: dto.priceLimitCents,
  minAge: dto.minAge,
  maxAge: dto.maxAge,
  zhimaEnabled: dto.zhimaEnabled,
});
