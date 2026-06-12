import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import type { PageResult } from "./staff-commission.dto";

const toIntOrDefault = (value: unknown, defaultValue: number): number => {
  const next = Number(value);
  return Number.isFinite(next) ? Math.trunc(next) : defaultValue;
};

export class StaffStudentListQueryDto {
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

  @IsOptional()
  @IsIn(["all", "due7", "due", "overdue"])
  tab?: "all" | "due7" | "due" | "overdue";
}

export interface StaffStudentItemDto {
  id: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  progressFinishedCount: number;
  progressTotalCount: number;
  nextDueDate?: string;
  overdueDays: number;
}

export type StaffStudentListDto = PageResult<StaffStudentItemDto>;
