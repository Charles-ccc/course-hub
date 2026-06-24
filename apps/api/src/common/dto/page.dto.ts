import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

const toIntOrDefault = (value: unknown, defaultValue: number): number => {
  const next = Number(value);
  return Number.isFinite(next) ? Math.trunc(next) : defaultValue;
};

export class PageQueryDto {
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

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export function buildPageResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PageResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    hasNext: page * pageSize < total,
  };
}
