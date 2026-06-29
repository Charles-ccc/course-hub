export type Role = "INSITUTION_ADMIN";

export type CourseStatus = "ONLINE" | "OFFLINE";

export type OrderStatus =
  | "CREATED"
  | "COOLING_OFF"
  | "ACTIVE"
  | "OVERDUE"
  | "COMPLETED"
  | "REFUNDED"
  | "TERMINATED";

export type PeriodStatus =
  | "PENDING"
  | "DELIVERED"
  | "PAID"
  | "OVERDUE"
  | "WRITTEN_OFF";

export type SettlementStatus = "PENDING" | "SETTLED";

export interface AuthSession {
  token: string;
  refreshToken: string;
  role: Role;
  orgId: string;
  orgName: string;
}

export interface InsitutionProfile {
  orgId: string;
  orgName: string;
  settlementRate: number;
  depositBalanceCents: number;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  instructorInfo: string;
  priceCents: number;
  periodCount: number;
  status: CourseStatus;
}

export interface Installment {
  id: string;
  periodNo: number;
  dueDate: string;
  plannedAmountCents: number;
  paidAmountCents: number;
  contentDeliveredAt?: string;
  status: PeriodStatus;
}

export interface Order {
  id: string;
  studentName: string;
  courseName: string;
  totalAmountCents: number;
  periodCount: number;
  status: OrderStatus;
  coolingOffEndAt?: string;
  createdAt: string;
  installments: Installment[];
}

export interface OverduePeriod {
  id: string;
  orderId: string;
  studentName: string;
  courseName: string;
  periodNo: number;
  dueDate: string;
  plannedAmountCents: number;
  status: "OVERDUE" | "WRITTEN_OFF";
}

export interface SettlementRecord {
  id: string;
  period: string;
  gmvCents: number;
  serviceFeeCents: number;
  status: SettlementStatus;
}

export interface QaQuestion {
  id: string;
  studentName: string;
  content: string;
  askedAt: string;
  replied: boolean;
  replyContent?: string;
  repliedAt?: string;
}
