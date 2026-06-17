import { Body, Controller, Post } from "@nestjs/common";
import { StudentAuthService } from "./student-auth.service";
import {
  AlipayLoginReqDto,
  RefreshReqDto,
  type AlipayLoginRespDto,
} from "./dto/alipay-auth.dto";

@Controller("auth")
export class StudentAuthController {
  constructor(private readonly studentAuthService: StudentAuthService) {}

  @Post("alipay/login")
  alipayLogin(@Body() body: AlipayLoginReqDto): Promise<AlipayLoginRespDto> {
    return this.studentAuthService.alipayLogin(body.authCode);
  }

  @Post("student/refresh")
  refreshToken(@Body() body: RefreshReqDto) {
    return this.studentAuthService.refreshToken(body.refreshToken);
  }
}
