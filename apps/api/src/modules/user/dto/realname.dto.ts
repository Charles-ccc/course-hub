import { IsString, Length, Matches } from 'class-validator';

export class RealnameDto {
  @IsString()
  @Length(2, 30)
  name: string;

  @IsString()
  @Matches(/^\d{17}[\dX]$/, { message: '身份证号格式不正确' })
  idNo: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;
}
