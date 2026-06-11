import { IsIn, IsOptional, Matches } from "class-validator";

export type SettlementStatus = "PENDING" | "SETTLED";

export class SettlementQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  period?: string;

  @IsOptional()
  @IsIn(["PENDING", "SETTLED"])
  status?: SettlementStatus;
}

export interface SettlementRecordDto {
  id: string;
  insitutionId: string;
  insitutionName: string;
  period: string;
  gmvCents: number;
  serviceFeeCents: number;
  status: SettlementStatus;
  settledAt?: string;
}
