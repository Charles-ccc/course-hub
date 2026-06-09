import { IsIn, IsString, Length, Matches } from "class-validator";

export class PhoneLoginReqDto {
  @IsString()
  @Matches(/^1\d{10}$/)
  phone!: string;

  @IsString()
  @Length(6, 64)
  password!: string;

  @IsIn(["INSTITUTION_WEB", "STAFF_H5", "STUDENT_MP", "ADMIN_WEB"])
  clientType!: "INSTITUTION_WEB" | "STAFF_H5" | "STUDENT_MP" | "ADMIN_WEB";
}

export interface LoginRespDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: "INSTITUTION_ADMIN";
  userId: string;
  displayName: string;
  orgId: string;
  orgName: string;
}
