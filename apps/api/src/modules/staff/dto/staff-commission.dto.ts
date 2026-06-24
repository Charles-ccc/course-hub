import { PageQueryDto, PageResult } from "../../../common/dto/page.dto";

export class StaffCommissionListQueryDto extends PageQueryDto {}

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

export type StaffCommissionListDto = PageResult<StaffCommissionItemDto>;
