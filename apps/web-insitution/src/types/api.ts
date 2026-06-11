import type { ApiSuccess, PageResult } from "@wangke/web-shared";
import type {
  CourseStatus,
  OrderStatus,
  PeriodStatus,
  Role,
  SettlementStatus,
} from "./domain";
export type { ApiSuccess, PageResult };

// The ApiSuccess and PageResult interfaces have been moved to the shared package.

export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  role: Role;
  userId: string;
  displayName: string;
  orgId?: string;
  orgName?: string;
}

export interface InsitutionDepositDto {
  orgId?: string;
  orgName?: string;
  settlementRate: number;
  depositBalanceCents: number;
}

export interface CourseDto {
  id: string;
  name: string;
  description: string;
  instructorInfo: string;
  priceCents: number;
  periodCount: number;
  status: CourseStatus;
}

export interface InstallmentDto {
  id: string;
  periodNo: number;
  dueDate: string;
  amountCents?: number;
  plannedAmountCents?: number;
  paidAmountCents?: number;
  contentDeliveredAt?: string;
  status: PeriodStatus;
}

export interface OrderDto {
  id: string;
  studentName: string;
  courseName: string;
  totalAmountCents: number;
  periodCount: number;
  status: OrderStatus;
  coolingOffEndAt?: string;
  createdAt: string;
  installments?: InstallmentDto[];
}

export interface OverduePeriodDto {
  id: string;
  orderId: string;
  studentName: string;
  courseName: string;
  periodNo: number;
  dueDate: string;
  plannedAmountCents?: number;
  amountCents?: number;
  status: "OVERDUE" | "WRITTEN_OFF";
}

export interface SettlementRecordDto {
  id: string;
  period: string;
  gmvCents: number;
  serviceFeeCents: number;
  status: SettlementStatus;
}

export interface QaQuestionDto {
  id: string;
  studentName: string;
  content: string;
  askedAt: string;
  replied: boolean;
  replyContent?: string;
  repliedAt?: string;
}

export type QuestionsPageDto = PageResult<QaQuestionDto>;
export type CoursesPageDto = PageResult<CourseDto>;
export type OrdersPageDto = PageResult<OrderDto>;
export type OverduesPageDto = PageResult<OverduePeriodDto>;
export type SettlementsPageDto = PageResult<SettlementRecordDto>;
