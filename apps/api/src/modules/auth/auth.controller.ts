import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RefreshTokenReqDto } from "../../common/auth/refresh-token.dto";
import { RequestRateLimitGuard } from "../../common/security/request-rate-limit.guard";
import { AuthService } from "./auth.service";
import { PhoneLoginReqDto, type LoginRespDto } from "./dto/phone-login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("phone/login")
  @UseGuards(RequestRateLimitGuard)
  phoneLogin(@Body() body: PhoneLoginReqDto): Promise<LoginRespDto> {
    return this.authService.phoneLogin(
      body.phone,
      body.password,
      body.clientType,
    );
  }

  @Post("refresh")
  @UseGuards(RequestRateLimitGuard)
  refresh(@Body() body: RefreshTokenReqDto): Promise<LoginRespDto> {
    return this.authService.refreshToken(body.refreshToken);
  }
}
