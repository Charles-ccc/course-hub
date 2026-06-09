import { IsOptional, Matches } from "class-validator";

export class GmvReportQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;
}

export interface GmvReportItemDto {
  institutionId: string;
  institutionName: string;
  gmvCents: number;
  serviceFeeCents: number;
}

export interface GmvReportDto {
  month: string;
  totalGmvCents: number;
  totalServiceFeeCents: number;
  items: GmvReportItemDto[];
}

export interface OverdueMonitorDto {
  overdueRate: number;
  overdueInstallments: number;
  totalInstallments: number;
}
