import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class AlipayLoginReqDto {
  @IsString()
  @IsNotEmpty()
  authCode!: string;
}

export class AlipayRegisterReqDto {
  @IsString()
  @IsNotEmpty()
  authCode!: string;

  @IsString()
  @IsNotEmpty()
  encryptedData!: string;

  @IsString()
  @IsOptional()
  iv?: string;

  @IsString()
  @IsNotEmpty()
  orgCode!: string;
}

export class OrgCodeValidateReqDto {
  @IsString()
  @IsNotEmpty()
  authCode!: string;

  @IsString()
  @IsNotEmpty()
  orgCode!: string;
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

export type OrgCodeValidateRespDto = {
  orgName: string;
  salesmanName: string | null;
};
