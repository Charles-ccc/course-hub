import { IsString, IsNotEmpty, Matches } from "class-validator";

export class RealnameInitReqDto {
  @IsString()
  @IsNotEmpty({ message: "请输入姓名" })
  name!: string;

  @IsString()
  @Matches(/^\d{17}[\dXx]$/, { message: "身份证号格式不正确" })
  idCardNo!: string;
}

export class RealnameConfirmReqDto {
  @IsString()
  @IsNotEmpty()
  certifyId!: string;
}

export type RealnameInitRespDto = {
  certifyId: string;
  certifyUrl: string;
};

export type RealnameConfirmRespDto = {
  realnameStatus: string;
  name: string | null;
};
