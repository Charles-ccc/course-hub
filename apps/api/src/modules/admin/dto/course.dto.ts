import { IsIn, IsOptional, IsString, Length } from "class-validator";

export type CourseStatus = "ONLINE" | "OFFLINE";
export type CourseAuditStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export class AdminCourseQueryDto {
  @IsOptional()
  @IsIn(["APPROVED", "PENDING_REVIEW", "REJECTED"])
  auditStatus?: CourseAuditStatus;

  @IsOptional()
  @IsString()
  institutionId?: string;
}

export class RejectCourseReqDto {
  @IsString()
  @Length(1, 200)
  reason!: string;
}

export interface AdminCourseDto {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  priceCents: number;
  status: CourseStatus;
  auditStatus: CourseAuditStatus;
  createdAt: string;
}
