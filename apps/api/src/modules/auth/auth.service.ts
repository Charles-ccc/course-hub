import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { compare } from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import type { LoginRespDto } from "./dto/phone-login.dto";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import { TokenService } from "../../common/auth/token.service";
import type { AppRole } from "../../common/auth/auth.types";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async phoneLogin(
    phone: string,
    password: string,
    clientType: string,
  ): Promise<LoginRespDto> {
    this.logger.log(
      JSON.stringify({
        event: "auth_login_attempt",
        clientType,
        phone: this.maskPhone(phone),
      }),
    );

    if (clientType === "INSITUTION_WEB") {
      return this.loginInsitution(phone, password);
    }

    if (clientType === "STAFF_H5") {
      return this.loginStaff(phone, password);
    }

    throw new UnauthorizedException("当前客户端暂未开放登录");
  }

  async refreshToken(refreshToken: string): Promise<LoginRespDto> {
    const refreshed =
      await this.tokenService.refreshAccessTokenByToken(refreshToken);
    this.logger.log(
      JSON.stringify({
        event: "auth_refresh_success",
        role: refreshed.user.role,
        userId: refreshed.user.subject,
      }),
    );

    return this.buildRefreshLoginResp(
      refreshed.user.subject,
      refreshed.user.role,
      refreshed.accessToken,
      refreshed.refreshToken,
      refreshed.expiresIn,
    );
  }

  private async loginInsitution(
    phone: string,
    password: string,
  ): Promise<LoginRespDto> {
    const user = await this.prisma.insitutionUser.findUnique({
      where: { phone },
      include: { insitution: true },
    });

    if (!user || user.insitution.status !== "ACTIVE") {
      throw new ApiBusinessException(40001, "手机号或密码错误", 401);
    }

    const passwordMatched = await compare(password, user.passwordHash);
    if (!passwordMatched) {
      throw new ApiBusinessException(40001, "手机号或密码错误", 401);
    }

    const tokenPair = await this.tokenService.issueTokenPair({
      userId: user.id,
      role: "INSITUTION_ADMIN",
      refreshOwner: { insitutionUserId: user.id },
    });

    this.logger.log(
      JSON.stringify({
        event: "auth_login_success",
        role: "INSITUTION_ADMIN",
        userId: user.id,
      }),
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      role: "INSITUTION_ADMIN",
      userId: user.id,
      displayName: user.displayName,
      orgId: user.insitutionId,
      orgName: user.insitution.name,
    };
  }

  private async loginStaff(
    phone: string,
    password: string,
  ): Promise<LoginRespDto> {
    const staff = await this.prisma.salesman.findUnique({
      where: { phone },
    });

    if (!staff) {
      throw new ApiBusinessException(40001, "手机号或密码错误", 401);
    }

    if (staff.status !== "ACTIVE") {
      throw new ApiBusinessException(
        40003,
        "当前账号已被禁用，请联系平台管理员",
        403,
      );
    }

    const passwordMatched = await compare(password, staff.passwordHash);
    if (!passwordMatched) {
      throw new ApiBusinessException(40001, "手机号或密码错误", 401);
    }

    const tokenPair = await this.tokenService.issueTokenPair({
      userId: staff.id,
      role: "STAFF",
      refreshOwner: { salesmanId: staff.id },
    });

    this.logger.log(
      JSON.stringify({
        event: "auth_login_success",
        role: "STAFF",
        userId: staff.id,
      }),
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      role: "STAFF",
      userId: staff.id,
      displayName: staff.name,
      staffId: staff.id,
      staffProfile: {
        name: staff.name,
        phone: staff.phone,
        staffId: staff.id,
        contractType: staff.contractType,
        groupName: staff.groupName ?? undefined,
      },
    };
  }

  private async buildRefreshLoginResp(
    userId: string,
    role: AppRole,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): Promise<LoginRespDto> {
    if (role === "INSITUTION_ADMIN") {
      const user = await this.prisma.insitutionUser.findUnique({
        where: { id: userId },
        include: { insitution: true },
      });
      if (!user) {
        throw new UnauthorizedException("Insitution user not found");
      }

      return {
        accessToken,
        refreshToken,
        expiresIn,
        role: "INSITUTION_ADMIN",
        userId: user.id,
        displayName: user.displayName,
        orgId: user.insitutionId,
        orgName: user.insitution.name,
      };
    }

    const staff = await this.prisma.salesman.findUnique({
      where: { id: userId },
    });
    if (!staff) {
      throw new UnauthorizedException("Staff user not found");
    }

    if (staff.status !== "ACTIVE") {
      throw new ApiBusinessException(
        40003,
        "当前账号已被禁用，请联系平台管理员",
        403,
      );
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
      role: "STAFF",
      userId: staff.id,
      displayName: staff.name,
      staffId: staff.id,
      staffProfile: {
        name: staff.name,
        phone: staff.phone,
        staffId: staff.id,
        contractType: staff.contractType,
        groupName: staff.groupName ?? undefined,
      },
    };
  }

  private maskPhone(phone: string): string {
    if (!/^\d{11}$/.test(phone)) {
      return "unknown";
    }
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }
}
