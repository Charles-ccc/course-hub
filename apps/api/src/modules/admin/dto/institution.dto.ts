import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from "class-validator";

export type InstitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";

export class AdminInstitutionQueryDto {
  @IsOptional()
  @IsEnum(["PENDING", "ACTIVE", "SUSPENDED", "EXITED"])
  status?: InstitutionStatus;
}

export class CreateInstitutionReqDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(18, 18)
  @Matches(/^\d{18}$/)
  socialCreditCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositBalanceCents?: number;
}

export class UpdateInstitutionReqDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(18, 18)
  @Matches(/^\d{18}$/)
  socialCreditCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositBalanceCents?: number;
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
