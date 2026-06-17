import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenService } from "../../common/auth/token.service";
import { AlipayService } from "./alipay.service";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import type {
  AlipayLoginRespDto,
  AlipayRegisterReqDto,
  OrgCodeValidateRespDto,
} from "./dto/alipay-auth.dto";

type FreezeRecord = {
  count: number;
  frozenUntil: Date | null;
  windowStart: Date;
};

const FREEZE_WINDOW_MS = 30 * 60 * 1000;
const FREEZE_MAX_FAILURES = 5;

@Injectable()
export class StudentAuthService {
  private readonly logger = new Logger(StudentAuthService.name);
  private readonly freezeStore = new Map<string, FreezeRecord>();

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

  async alipayRegister(dto: AlipayRegisterReqDto): Promise<AlipayLoginRespDto> {
    const openId = await this.alipayService.getOpenIdByAuthCode(dto.authCode);

    const existing = await this.prisma.student.findUnique({
      where: { alipayOpenId: openId },
    });
    if (existing) {
      const tokenPair = await this.tokenService.issueTokenPair({
        userId: existing.id,
        role: "STUDENT",
        refreshOwner: { studentId: existing.id },
      });
      return {
        needRegister: false,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        userId: existing.id,
        name: existing.name,
        phone: existing.phone,
        realnameStatus: existing.realnameStatus,
      };
    }

    const orgCodeRecord = await this.prisma.orgCode.findUnique({
      where: { code: dto.orgCode },
      include: { insitution: true, salesman: true },
    });
    if (!orgCodeRecord || orgCodeRecord.status !== "ACTIVE") {
      throw new ApiBusinessException(40011, "机构码无效", 400);
    }

    const phone = this.alipayService.decryptPhone(dto.encryptedData, dto.iv);

    const existingByPhone = await this.prisma.student.findUnique({
      where: { phone },
    });
    if (existingByPhone) {
      throw new ApiBusinessException(40013, "该手机号已注册，请直接登录", 400);
    }

    const student = await this.prisma.student.create({
      data: {
        id: randomUUID(),
        phone,
        alipayOpenId: openId,
        insitutionId: orgCodeRecord.insitutionId,
        orgCodeId: orgCodeRecord.id,
        boundSalesmanId: orgCodeRecord.salesmanId ?? null,
        boundAt: orgCodeRecord.salesmanId ? new Date() : null,
      },
    });

    this.logger.log(
      JSON.stringify({
        event: "student_register_success",
        studentId: student.id,
        insitutionId: orgCodeRecord.insitutionId,
      }),
    );

    const tokenPair = await this.tokenService.issueTokenPair({
      userId: student.id,
      role: "STUDENT",
      refreshOwner: { studentId: student.id },
    });

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

  async validateOrgCode(
    authCode: string,
    orgCode: string,
  ): Promise<OrgCodeValidateRespDto> {
    const openId = await this.alipayService.getOpenIdByAuthCode(authCode);

    this.assertNotFrozen(openId);

    const orgCodeRecord = await this.prisma.orgCode.findUnique({
      where: { code: orgCode },
      include: { insitution: true, salesman: true },
    });

    if (!orgCodeRecord || orgCodeRecord.status !== "ACTIVE") {
      this.recordFailure(openId);
      throw new ApiBusinessException(
        40011,
        "机构码无效，请联系招生老师确认",
        400,
      );
    }

    this.clearFailures(openId);

    return {
      orgName: orgCodeRecord.insitution.name,
      salesmanName: orgCodeRecord.salesman?.name ?? null,
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

  private assertNotFrozen(openId: string): void {
    const record = this.freezeStore.get(openId);
    if (!record?.frozenUntil) return;

    const now = Date.now();
    if (record.frozenUntil.getTime() > now) {
      const remainingMin = Math.ceil(
        (record.frozenUntil.getTime() - now) / 60000,
      );
      throw new ApiBusinessException(
        40012,
        `验证失败次数过多，请 ${remainingMin} 分钟后再试`,
        429,
      );
    }

    this.freezeStore.delete(openId);
  }

  private recordFailure(openId: string): void {
    const now = new Date();
    let record = this.freezeStore.get(openId);

    if (
      !record ||
      now.getTime() - record.windowStart.getTime() > FREEZE_WINDOW_MS
    ) {
      record = { count: 0, frozenUntil: null, windowStart: now };
    }

    record.count++;

    if (record.count >= FREEZE_MAX_FAILURES) {
      record.frozenUntil = new Date(now.getTime() + FREEZE_WINDOW_MS);
      record.count = 0;
      record.windowStart = now;
    }

    this.freezeStore.set(openId, record);
  }

  private clearFailures(openId: string): void {
    this.freezeStore.delete(openId);
  }
}
