import { IsIn, IsString, IsNotEmpty } from "class-validator";

export class CreateOrderReqDto {
  @IsString()
  @IsNotEmpty({ message: "课程参数缺失" })
  courseId!: string;

  @IsIn(["IMMEDIATE", "DEFERRED"], { message: "付款方式不正确" })
  payType!: "IMMEDIATE" | "DEFERRED";
}

export interface OrderInstallmentDto {
  periodNo: number;
  dueDate: string;
  plannedAmountCents: number;
  paidAmountCents: number;
  status: string;
}

export interface OrderDetailDto {
  id: string;
  courseId: string | null;
  courseName: string;
  insitutionName: string;
  studentName: string;
  totalAmountCents: number;
  periodCount: number;
  payType: string;
  status: string;
  createdAt: string;
  installments: OrderInstallmentDto[];
}

export interface CreateOrderRespDto {
  orderId: string;
}
