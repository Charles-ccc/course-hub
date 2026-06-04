import { IsString, IsEnum, IsOptional } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  code: string;

  @IsEnum(['student', 'staff'])
  appType: 'student' | 'staff';

  @IsOptional()
  @IsString()
  referrerStaffId?: string;

  @IsOptional()
  @IsString()
  referrerStudentId?: string;
}
