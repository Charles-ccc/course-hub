import { IsString, IsEnum, IsOptional } from 'class-validator';

export class AlipayLoginDto {
  @IsString()
  authCode: string;

  @IsEnum(['student', 'staff'])
  appType: 'student' | 'staff';

  @IsOptional()
  @IsString()
  referrerStaffId?: string;

  @IsOptional()
  @IsString()
  referrerStudentId?: string;
}
