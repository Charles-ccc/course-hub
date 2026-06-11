import { Type } from "class-transformer";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from "class-validator";

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

export class CreateCourseReqDto {
  @IsString()
  institutionId!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(1, 2000)
  description!: string;

  @IsString()
  @Length(1, 500)
  instructorInfo!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  priceCents!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  periodCount!: number;
}

export class UpdateCourseReqDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  instructorInfo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  priceCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  periodCount?: number;
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
  description: string;
  instructorInfo: string;
  priceCents: number;
  periodCount: number;
  status: CourseStatus;
  auditStatus: CourseAuditStatus;
  createdAt: string;
}
