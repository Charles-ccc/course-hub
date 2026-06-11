import { Type } from "class-transformer";
import { IsEnum, IsInt, IsString, Length, Max, Min } from "class-validator";

export type CourseStatus = "ONLINE" | "OFFLINE";

export class CreateCourseReqDto {
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
  @IsInt()
  @Min(1)
  priceCents!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  periodCount!: number;
}

export class UpdateCourseStatusReqDto {
  @IsEnum(["ONLINE", "OFFLINE"])
  status!: CourseStatus;
}

export interface CourseDto {
  id: string;
  name: string;
  description: string;
  instructorInfo: string;
  priceCents: number;
  periodCount: number;
  status: CourseStatus;
}
