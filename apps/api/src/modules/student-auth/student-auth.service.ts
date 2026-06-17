import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenService } from "../../common/auth/token.service";
import { AlipayService } from "./alipay.service";
import type { AlipayLoginRespDto } from "./dto/alipay-auth.dto";

@Injectable()
export class StudentAuthService {
  private readonly logger = new Logger(StudentAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly alipayService: AlipayService,
  ) {}

  async alipayLogin(authCode: string): Promise<AlipayLoginRespDto> {
    const openId = await this.alipayService.getOpenIdByAuthCode(authCode);

    this.logger.log(
      JSON.stringify({ event: "student_alipay_login", openId }),
    );

    const student = await this.prisma.student.findUnique({
      where: { alipayOpenId: openId },
    });

    if (!student) {
      return { needRegister: true };
    }

    const tokenPair = await this.tokenService.issueTokenPair({
      userId: student.id,
      role: "STUDENT",
      refreshOwner: { studentId: student.id },
    });

    this.logger.log(
      JSON.stringify({
        event: "student_login_success",
        studentId: student.id,
      }),
    );

    return {
      needRegister: false,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      userId: student.id,
      name: student.name,
      phone: student.phone,
      realnameStatus: student.realnameStatus,
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
    name: string | null;
    phone: string;
    realnameStatus: string;
  }> {
    const refreshed =
      await this.tokenService.refreshAccessToken(refreshToken, "STUDENT");

    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: refreshed.user.subject },
    });

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresIn: refreshed.expiresIn,
      userId: student.id,
      name: student.name,
      phone: student.phone,
      realnameStatus: student.realnameStatus,
    };
  }
}
