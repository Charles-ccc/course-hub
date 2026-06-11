import { IsIn, IsOptional } from "class-validator";

export type OrderStatus =
  | "CREATED"
  | "COOLING_OFF"
  | "ACTIVE"
  | "COMPLETED"
  | "REFUNDED"
  | "TERMINATED";

export type PeriodStatus =
  | "PENDING"
  | "DELIVERED"
  | "PAID"
  | "OVERDUE"
  | "WRITTEN_OFF";

export class InsitutionOrderQueryDto {
  @IsOptional()
  @IsIn([
    "CREATED",
    "COOLING_OFF",
    "ACTIVE",
    "COMPLETED",
    "REFUNDED",
    "TERMINATED",
  ])
  status?: OrderStatus;
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
