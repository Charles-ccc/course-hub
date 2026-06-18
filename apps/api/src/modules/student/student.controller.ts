import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequireRole } from "../../common/auth/roles.decorator";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { RealnameService } from "./realname.service";
import {
  RealnameConfirmReqDto,
  type RealnameInitRespDto,
  type RealnameConfirmRespDto,
} from "./dto/realname.dto";

@Controller("users")
@UseGuards(SimpleAuthGuard)
@RequireRole("STUDENT")
export class StudentController {
  constructor(private readonly realnameService: RealnameService) {}

  @Post("realname/initialize")
  initialize(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RealnameInitRespDto> {
    return this.realnameService.initialize(user.subject);
  }

  @Post("realname/confirm")
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RealnameConfirmReqDto,
  ): Promise<RealnameConfirmRespDto> {
    return this.realnameService.confirm(user.subject, body.certifyId);
  }
}
