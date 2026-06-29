import type {
  OrderStatus,
  PeriodStatus,
  SettlementStatus,
} from "../types/domain";
import {
  centsToYuan,
  formatDate,
  formatDateTime,
  maskName,
} from "@wangke/web-shared";

export { centsToYuan, formatDate, formatDateTime, maskName };

export const orderStatusLabel: Record<OrderStatus, string> = {
  CREATED: "待签约",
  COOLING_OFF: "冷静期中",
  ACTIVE: "学习中",
  OVERDUE: "已逾期",
  COMPLETED: "已完成",
  REFUNDED: "已退款",
  TERMINATED: "已终止",
};

export const periodStatusLabel: Record<PeriodStatus, string> = {
  PENDING: "待扣款",
  DELIVERED: "已交付，待代扣",
  PAID: "已还款",
  OVERDUE: "已逾期",
  WRITTEN_OFF: "已核销",
};

export const settlementStatusLabel: Record<SettlementStatus, string> = {
  PENDING: "待结算",
  SETTLED: "已结算",
};
