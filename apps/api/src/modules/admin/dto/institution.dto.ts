import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export type InstitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";

export class AdminInstitutionQueryDto {
  @IsOptional()
  @IsEnum(["PENDING", "ACTIVE", "SUSPENDED", "EXITED"])
  status?: InstitutionStatus;
}

export class ApproveInstitutionReqDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  settlementRate!: number;
}

export class SuspendInstitutionReqDto {
  @IsString()
  @Length(1, 200)
  reason!: string;
}

export interface InstitutionDto {
  id: string;
  name: string;
  socialCreditCode: string;
  settlementRate: number;
  depositBalanceCents: number;
  cumulativeGmvCents: number;
  cumulativeServiceFeeCents: number;
  status: InstitutionStatus;
}
