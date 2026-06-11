export type SettlementStatus = "PENDING" | "SETTLED";

export interface SettlementRecordDto {
  id: string;
  period: string;
  gmvCents: number;
  serviceFeeCents: number;
  status: SettlementStatus;
  settledAt?: string;
}
