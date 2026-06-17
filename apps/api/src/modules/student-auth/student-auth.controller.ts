import { Body, Controller, Post } from "@nestjs/common";
import { StudentAuthService } from "./student-auth.service";
import {
  AlipayLoginReqDto,
  AlipayRegisterReqDto,
  OrgCodeValidateReqDto,
  RefreshReqDto,
  type AlipayLoginRespDto,
  type OrgCodeValidateRespDto,
} from "./dto/alipay-auth.dto";

@Controller("auth")
export class StudentAuthController {
  constructor(private readonly studentAuthService: StudentAuthService) {}

  @Post("alipay/login")
  alipayLogin(@Body() body: AlipayLoginReqDto): Promise<AlipayLoginRespDto> {
    return this.studentAuthService.alipayLogin(body.authCode);
  }

  @Post("alipay/register")
  alipayRegister(
    @Body() body: AlipayRegisterReqDto,
  ): Promise<AlipayLoginRespDto> {
    return this.studentAuthService.alipayRegister(body);
  }

  @Post("org-code/validate")
  validateOrgCode(
    @Body() body: OrgCodeValidateReqDto,
  ): Promise<OrgCodeValidateRespDto> {
    return this.studentAuthService.validateOrgCode(body.authCode, body.orgCode);
  }

  @Post("student/refresh")
  refreshToken(@Body() body: RefreshReqDto) {
    return this.studentAuthService.refreshToken(body.refreshToken);
  }
}
