import { Body, Controller, Post } from "@nestjs/common";
import { RefreshTokenReqDto } from "../../common/auth/refresh-token.dto";
import { AuthService } from "./auth.service";
import { PhoneLoginReqDto, type LoginRespDto } from "./dto/phone-login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("phone/login")
  phoneLogin(@Body() body: PhoneLoginReqDto): Promise<LoginRespDto> {
    return this.authService.phoneLogin(
      body.phone,
      body.password,
      body.clientType,
    );
  }

  @Post("refresh")
  refresh(@Body() body: RefreshTokenReqDto): Promise<LoginRespDto> {
    return this.authService.refreshInsitutionToken(body.refreshToken);
  }
}
