import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

const toIntOrDefault = (value: unknown, defaultValue: number): number => {
  const next = Number(value);
  return Number.isFinite(next) ? Math.trunc(next) : defaultValue;
};

export class StaffCommissionListQueryDto {
  @IsOptional()
  @Transform(({ value }) => toIntOrDefault(value, 1))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => toIntOrDefault(value, 20))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export interface StaffCommissionSummaryDto {
  settledCents: number;
  pendingCents: number;
  heldCents: number;
}

export interface StaffCommissionItemDto {
  id: string;
  type: "CLOSING" | "PERFORMANCE";
  periodNo?: number;
  status: "PENDING" | "SETTLED" | "HELD" | "CLAWED_BACK";
  amountCents: number;
  studentName: string;
  courseName: string;
  createdAt: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type StaffCommissionListDto = PageResult<StaffCommissionItemDto>;
