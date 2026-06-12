import type { ApiSuccess } from "@wangke/web-shared";
import type {
  CommissionItem,
  CommissionSummary,
  PageResult,
  Role,
  StaffProfile,
  StudentItem,
} from "./domain";

export type { ApiSuccess };

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: Role;
  userId: string;
  displayName: string;
  staffId: string;
  staffProfile: Omit<StaffProfile, "status">;
}

export type StaffCommissionSummaryDto = CommissionSummary;
export type StaffCommissionPageDto = PageResult<CommissionItem>;
export type StaffStudentPageDto = PageResult<StudentItem>;
export type StaffProfileDto = StaffProfile;
