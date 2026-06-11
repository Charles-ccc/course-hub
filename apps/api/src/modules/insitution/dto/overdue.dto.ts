import { IsString, Length } from "class-validator";

export class WriteoffReqDto {
  @IsString()
  @Length(1, 200)
  remark!: string;
}

export interface OverduePeriodDto {
  id: string;
  orderId: string;
  studentName: string;
  courseName: string;
  periodNo: number;
  dueDate: string;
  plannedAmountCents?: number;
  amountCents?: number;
  status: "OVERDUE" | "WRITTEN_OFF";
}
