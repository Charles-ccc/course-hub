import type {
  ContractType,
  CourseAuditStatus,
  InstitutionStatus,
  SalesmanStatus,
  SettlementStatus,
} from "../types/domain";
import {
  centsToYuan,
  formatDate,
  formatDateTime,
  maskName,
} from "@wangke/web-shared";

export { centsToYuan, formatDate, formatDateTime, maskName };

export const institutionStatusLabel: Record<InstitutionStatus, string> = {
  PENDING: "待审核",
  ACTIVE: "运营中",
  SUSPENDED: "已暂停",
  EXITED: "已退出",
};

export const courseAuditStatusLabel: Record<CourseAuditStatus, string> = {
  PENDING_REVIEW: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

export const salesmanStatusLabel: Record<SalesmanStatus, string> = {
  ACTIVE: "正常",
  DISABLED: "已禁用",
};

export const contractTypeLabel: Record<ContractType, string> = {
  EMPLOYEE: "员工制",
  AGENT: "代理制",
};

export const settlementStatusLabel: Record<SettlementStatus, string> = {
  PENDING: "待结算",
  SETTLED: "已结算",
};
