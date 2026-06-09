import { IsString, Length } from "class-validator";

export class RefreshTokenReqDto {
  @IsString()
  @Length(20, 4096)
  refreshToken!: string;
}
