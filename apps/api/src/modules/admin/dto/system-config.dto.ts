import { Type } from "class-transformer";
import { IsBoolean, IsInt, Max, Min } from "class-validator";

export class UpdateSystemConfigReqDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceLimitCents!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  minAge!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  maxAge!: number;

  @IsBoolean()
  zhimaEnabled!: boolean;
}

export interface SystemConfigDto {
  priceLimitCents: number;
  minAge: number;
  maxAge: number;
  zhimaEnabled: boolean;
}
