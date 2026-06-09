import { IsString, Length, Matches } from "class-validator";

export class AdminLoginReqDto {
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;

  @IsString()
  @Length(8, 64)
  password!: string;
}

export interface LoginRespDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: "PLATFORM_ADMIN";
  userId: string;
  displayName: string;
}
