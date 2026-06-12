import { IsIn, IsString, Length, Matches } from "class-validator";

export class PhoneLoginReqDto {
  @IsString()
  @Matches(/^1\d{10}$/)
  phone!: string;

  @IsString()
  @Length(6, 64)
  password!: string;

  @IsIn(["INSITUTION_WEB", "STAFF_H5", "STUDENT_MP", "ADMIN_WEB"])
  clientType!: "INSITUTION_WEB" | "STAFF_H5" | "STUDENT_MP" | "ADMIN_WEB";
}

export interface StaffProfileDto {
  name: string;
  phone: string;
  staffId: string;
  contractType: "EMPLOYEE" | "AGENT";
  groupName?: string;
}

export interface LoginRespDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: "INSITUTION_ADMIN" | "STAFF";
  userId: string;
  displayName: string;
  orgId?: string;
  orgName?: string;
  staffId?: string;
  staffProfile?: StaffProfileDto;
}
