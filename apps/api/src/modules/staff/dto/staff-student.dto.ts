import { IsIn, IsOptional } from "class-validator";
import { PageQueryDto, PageResult } from "../../../common/dto/page.dto";

export class StaffStudentListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(["all", "due7", "due", "overdue"])
  tab?: "all" | "due7" | "due" | "overdue";
}

export interface StaffStudentItemDto {
  id: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  progressFinishedCount: number;
  progressTotalCount: number;
  nextDueDate?: string;
  overdueDays: number;
}

export type StaffStudentListDto = PageResult<StaffStudentItemDto>;
