export type Role = "PLATFORM_ADMIN";

export type InsitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";

export type CourseStatus = "ONLINE" | "OFFLINE";

export type CourseAuditStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type SalesmanStatus = "ACTIVE" | "DISABLED";

export type ContractType = "EMPLOYEE" | "AGENT";

export type SettlementStatus = "PENDING" | "SETTLED";

export interface AuthSession {
  token: string;
  refreshToken: string;
  role: Role;
  username: string;
}

export interface HealthMetrics {
  totalGmvCents: number;
  activeOrderCount: number;
  repaymentRate: number;
  overdueRate: number;
  refundRate: number;
  status: "HEALTHY" | "WARNING";
  warningMetrics: Array<"REPAYMENT_RATE" | "OVERDUE_RATE" | "REFUND_RATE">;
}

export interface Insitution {
  id: string;
  name: string;
  socialCreditCode: string;
  settlementRate: number;
  depositBalanceCents: number;
  cumulativeGmvCents: number;
  cumulativeServiceFeeCents: number;
  status: InsitutionStatus;
}

export interface Course {
  id: string;
  insitutionId: string;
  name: string;
  description: string;
  instructorInfo: string;
  insitutionName: string;
  priceCents: number;
  periodCount: number;
  status: CourseStatus;
  auditStatus: CourseAuditStatus;
  createdAt: string;
}

export type AdminCourse = Course;

export interface Salesman {
  id: string;
  insitutionId: string;
  name: string;
  phone: string;
  contractType: ContractType;
  status: SalesmanStatus;
  studentCount: number;
  cumulativeCommissionCents: number;
}

export interface GmvReportItem {
  insitutionId: string;
  insitutionName: string;
  gmvCents: number;
  serviceFeeCents: number;
}

export interface GmvReport {
  month: string;
  totalGmvCents: number;
  totalServiceFeeCents: number;
  items: GmvReportItem[];
}

export interface OverdueMonitor {
  overdueRate: number;
  overdueInstallments: number;
  totalInstallments: number;
}

export interface SettlementRecord {
  id: string;
  insitutionId: string;
  insitutionName: string;
  period: string;
  gmvCents: number;
  serviceFeeCents: number;
  status: SettlementStatus;
  settledAt?: string;
}

export interface SystemConfig {
  priceLimitCents: number;
  minAge: number;
  maxAge: number;
  zhimaEnabled: boolean;
}
