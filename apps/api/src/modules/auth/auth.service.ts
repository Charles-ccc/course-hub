import { Injectable, UnauthorizedException } from "@nestjs/common";
import { compare } from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import type { LoginRespDto } from "./dto/phone-login.dto";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import { TokenService } from "../../common/auth/token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async phoneLogin(
    phone: string,
    password: string,
    clientType: string,
  ): Promise<LoginRespDto> {
    if (clientType !== "INSTITUTION_WEB") {
      throw new UnauthorizedException("当前仅开放机构端登录");
    }

    const user = await this.prisma.institutionUser.findUnique({
      where: { phone },
      include: { institution: true },
    });

    if (!user || user.institution.status !== "ACTIVE") {
      throw new ApiBusinessException(40001, "手机号或密码错误", 401);
    }

    const passwordMatched = await compare(password, user.passwordHash);
    if (!passwordMatched) {
      throw new ApiBusinessException(40001, "手机号或密码错误", 401);
    }

    const tokenPair = await this.tokenService.issueTokenPair({
      userId: user.id,
      role: "INSTITUTION_ADMIN",
      refreshOwner: { institutionUserId: user.id },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      role: "INSTITUTION_ADMIN",
      userId: user.id,
      displayName: user.displayName,
      orgId: user.institutionId,
      orgName: user.institution.name,
    };
  }

  async refreshInstitutionToken(refreshToken: string): Promise<LoginRespDto> {
    const refreshed = await this.tokenService.refreshAccessToken(
      refreshToken,
      "INSTITUTION_ADMIN",
    );
    const user = await this.prisma.institutionUser.findUnique({
      where: { id: refreshed.user.subject },
      include: { institution: true },
    });
    if (!user) {
      throw new UnauthorizedException("Institution user not found");
    }

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresIn: refreshed.expiresIn,
      role: "INSTITUTION_ADMIN",
      userId: user.id,
      displayName: user.displayName,
      orgId: user.institutionId,
      orgName: user.institution.name,
    };
  }
}
