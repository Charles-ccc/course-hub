import { IsOptional, IsString, MaxLength } from "class-validator";
import { PageQueryDto, PageResult } from "../../../common/dto/page.dto";

export class CourseListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;
}

export interface CourseListItemDto {
  id: string;
  name: string;
  insitutionName: string;
  priceCents: number;
  periodCount: number;
  imageUrl: string | null;
}

export type CourseListDto = PageResult<CourseListItemDto>;

export interface CourseDetailDto {
  id: string;
  name: string;
  insitutionName: string;
  description: string;
  instructorInfo: string;
  outline: string | null;
  teacherContact: string | null;
  priceCents: number;
  periodCount: number;
  imageUrl: string | null;
}

export interface CourseVideoItemDto {
  id: string;
  title: string;
  durationSec: number;
  isTrial: boolean;
  sortOrder: number;
}

export type CourseVideoListDto = CourseVideoItemDto[];
