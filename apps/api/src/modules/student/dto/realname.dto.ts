import { IsString, IsNotEmpty } from "class-validator";

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
