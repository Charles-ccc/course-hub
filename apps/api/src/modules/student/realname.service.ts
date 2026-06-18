import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AlipayService } from "../student-auth/alipay.service";
import { ApiBusinessException } from "../../common/exceptions/api-business.exception";
import type {
  RealnameInitRespDto,
  RealnameConfirmRespDto,
} from "./dto/realname.dto";

@Injectable()
export class RealnameService {
  private readonly logger = new Logger(RealnameService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alipayService: AlipayService,
  ) {}

  async initialize(studentId: string): Promise<RealnameInitRespDto> {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    if (student.realnameStatus === "VERIFIED") {
      throw new ApiBusinessException(40031, "您已完成实名认证，无需重复提交", 400);
    }

    const { certifyId, certifyUrl } =
      await this.alipayService.initializeCertify(studentId);

    this.logger.log(
      JSON.stringify({ event: "realname_initialize", studentId, certifyId }),
    );

    return { certifyId, certifyUrl };
  }

  async confirm(
    studentId: string,
    certifyId: string,
  ): Promise<RealnameConfirmRespDto> {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    if (student.realnameStatus === "VERIFIED") {
      return { realnameStatus: "VERIFIED", name: student.name };
    }

    const certifyResult = await this.alipayService.queryCertify(certifyId);

    if (!certifyResult.passed) {
      this.logger.log(
        JSON.stringify({
          event: "realname_rejected",
          studentId,
          certifyId,
        }),
      );
      await this.prisma.student.update({
        where: { id: studentId },
        data: { realnameStatus: "REJECTED" },
      });
      return { realnameStatus: "REJECTED", name: student.name };
    }

    if (certifyResult.certNo) {
      const age = this.calcAgeFromCertNo(certifyResult.certNo);
      if (age !== null) {
        const config = await this.prisma.systemConfig.findFirst();
        const minAge = config?.minAge ?? 18;
        if (age < minAge) {
          throw new ApiBusinessException(
            40032,
            `年龄不足 ${minAge} 岁，无法完成认证`,
            400,
          );
        }
      }
    }

    const existingRecord = await this.prisma.realnameRecord.findUnique({
      where: { certifyId },
    });

    if (!existingRecord) {
      await this.prisma.realnameRecord.create({
        data: {
          id: require("node:crypto").randomUUID(),
          studentId,
          certifyId,
          status: "VERIFIED",
        },
      });
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: {
        realnameStatus: "VERIFIED",
        name: certifyResult.name ?? student.name,
      },
    });

    this.logger.log(
      JSON.stringify({ event: "realname_verified", studentId, certifyId }),
    );

    return {
      realnameStatus: "VERIFIED",
      name: updatedStudent.name,
    };
  }

  private calcAgeFromCertNo(certNo: string): number | null {
    if (certNo.length < 18) return null;
    const year = parseInt(certNo.substring(6, 10), 10);
    const month = parseInt(certNo.substring(10, 12), 10);
    const day = parseInt(certNo.substring(12, 14), 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
