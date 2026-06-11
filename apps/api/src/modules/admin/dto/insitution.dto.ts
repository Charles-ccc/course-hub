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

export type InsitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";

export class AdminInsitutionQueryDto {
  @IsOptional()
  @IsEnum(["PENDING", "ACTIVE", "SUSPENDED", "EXITED"])
  status?: InsitutionStatus;
}

export class CreateInsitutionReqDto {
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

export class UpdateInsitutionReqDto {
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

export class ApproveInsitutionReqDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  settlementRate!: number;
}

export class SuspendInsitutionReqDto {
  @IsString()
  @Length(1, 200)
  reason!: string;
}

export interface InsitutionDto {
  id: string;
  name: string;
  socialCreditCode: string;
  settlementRate: number;
  depositBalanceCents: number;
  cumulativeGmvCents: number;
  cumulativeServiceFeeCents: number;
  status: InsitutionStatus;
}
