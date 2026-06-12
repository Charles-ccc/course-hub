import dayjs from "dayjs";
import { centsToYuan, formatDate, formatDateTime } from "@wangke/web-shared";

export { centsToYuan, formatDate, formatDateTime };

export const studentStatusLabel: Record<
  "ACTIVE" | "COMPLETED" | "OVERDUE",
  string
> = {
  ACTIVE: "学习中",
  COMPLETED: "已完成",
  OVERDUE: "已逾期",
};

export const commissionStatusLabel: Record<
  "PENDING" | "SETTLED" | "HELD" | "CLAWED_BACK",
  string
> = {
  PENDING: "待结算",
  SETTLED: "已结算",
  HELD: "暂缓",
  CLAWED_BACK: "已扣回",
};

export const commissionTypeLabel = (
  type: "CLOSING" | "PERFORMANCE",
  periodNo?: number,
): string => {
  if (type === "CLOSING") {
    return "成单提成";
  }
  return `履约提成（第 ${periodNo ?? "-"} 期）`;
};

export const dueTagText = (nextDueDate?: string, overdueDays = 0): string => {
  if (!nextDueDate) {
    return "";
  }
  if (overdueDays > 0) {
    return `逾期 ${overdueDays} 天`;
  }
  const now = dayjs();
  const due = dayjs(nextDueDate);
  const diff = due.startOf("day").diff(now.startOf("day"), "day");
  if (diff === 0) {
    return "今日还款";
  }
  if (diff > 0 && diff <= 7) {
    return `${diff} 天后还款`;
  }
  return "";
};
