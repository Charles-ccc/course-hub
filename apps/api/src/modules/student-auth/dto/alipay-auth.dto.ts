import { IsString, IsNotEmpty } from "class-validator";

export class AlipayLoginReqDto {
  @IsString()
  @IsNotEmpty()
  authCode!: string;
}

export class RefreshReqDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export type AlipayLoginRespDto =
  | { needRegister: true }
  | {
      needRegister: false;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      userId: string;
      name: string | null;
      phone: string;
      realnameStatus: string;
    };
