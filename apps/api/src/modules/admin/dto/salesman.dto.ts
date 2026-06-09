import { IsIn, IsOptional, IsString, Length, Matches } from "class-validator";

export type SalesmanStatus = "ACTIVE" | "DISABLED";
export type ContractType = "EMPLOYEE" | "AGENT";

export class AdminSalesmanQueryDto {
  @IsOptional()
  @IsIn(["ACTIVE", "DISABLED"])
  status?: SalesmanStatus;
}

export class CreateSalesmanReqDto {
  @IsString()
  institutionId!: string;

  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;

  @IsString()
  @Length(8, 64)
  password!: string;

  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Matches(/^1\d{10}$/)
  phone!: string;

  @IsIn(["EMPLOYEE", "AGENT"])
  contractType!: ContractType;
}

export interface SalesmanDto {
  id: string;
  institutionId: string;
  name: string;
  phone: string;
  contractType: ContractType;
  status: SalesmanStatus;
  studentCount: number;
  cumulativeCommissionCents: number;
}
