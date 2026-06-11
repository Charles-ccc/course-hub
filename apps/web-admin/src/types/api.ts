import type { ApiSuccess, PageResult } from "@wangke/web-shared";
import type {
  ContractType,
  CourseAuditStatus,
  CourseStatus,
  InstitutionStatus,
  Role,
  SalesmanStatus,
  SettlementStatus,
} from "./domain";
export type { ApiSuccess, PageResult };

export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  role: Role;
  userId: string;
  displayName: string;
}

export interface DashboardHealthDto {
  totalGmvCents: number;
  activeOrderCount: number;
  repaymentRate: number;
  overdueRate: number;
  refundRate: number;
  status: "HEALTHY" | "WARNING";
  warningMetrics: Array<"REPAYMENT_RATE" | "OVERDUE_RATE" | "REFUND_RATE">;
}

export interface InstitutionDto {
  id: string;
  name: string;
  socialCreditCode: string;
  settlementRate: number;
  depositBalanceCents: number;
  cumulativeGmvCents: number;
  cumulativeServiceFeeCents: number;
  status: InstitutionStatus;
}

export interface AdminCourseDto {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  description: string;
  instructorInfo: string;
  priceCents: number;
  periodCount: number;
  status: CourseStatus;
  auditStatus: CourseAuditStatus;
  createdAt: string;
}

export interface SalesmanDto {
  id: string;
  institutionId: string;
  name: string;
  phone: string;
  contractType: ContractType;
  status: SalesmanStatus;
  studentCount: number;
  cumulativeCommissionCents: number;
}

export interface GmvReportDto {
  month: string;
  totalGmvCents: number;
  totalServiceFeeCents: number;
  items: Array<{
    institutionId: string;
    institutionName: string;
    gmvCents: number;
    serviceFeeCents: number;
  }>;
}

export interface OverdueMonitorDto {
  overdueRate: number;
  overdueInstallments: number;
  totalInstallments: number;
}

export interface SettlementRecordDto {
  id: string;
  institutionId: string;
  institutionName: string;
  period: string;
  gmvCents: number;
  serviceFeeCents: number;
  status: SettlementStatus;
  settledAt?: string;
}

export interface SystemConfigDto {
  priceLimitCents: number;
  minAge: number;
  maxAge: number;
  zhimaEnabled: boolean;
}

export type InstitutionsPageDto = PageResult<InstitutionDto>;
export type CoursesPageDto = PageResult<AdminCourseDto>;
export type SalesmenPageDto = PageResult<SalesmanDto>;
export type SettlementsPageDto = PageResult<SettlementRecordDto>;
