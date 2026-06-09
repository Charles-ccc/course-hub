export interface DashboardHealthDto {
  totalGmvCents: number;
  activeOrderCount: number;
  repaymentRate: number;
  overdueRate: number;
  refundRate: number;
  status: "HEALTHY" | "WARNING";
  warningMetrics: Array<"REPAYMENT_RATE" | "OVERDUE_RATE" | "REFUND_RATE">;
}
