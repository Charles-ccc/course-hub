import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RealnameService } from './realname.service';
import { RealnameDto } from './dto/realname.dto';
import { FaceVerifyDto } from './dto/face-verify.dto';
import { BindPhoneDto } from './dto/bind-phone.dto';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private realnameService: RealnameService,
  ) {}

  async verifyRealname(userId: string, dto: RealnameDto) {
    const result = await this.realnameService.verifyFourElements(dto);

    if (!result.success) {
      throw new BadRequestException('实名认证失败，请检查信息是否正确');
    }

    if (result.age < 18) {
      // 硬拦截：未成年人
      throw new ForbiddenException({ code: 40001, message: '未成年用户，禁止注册' });
    }

    const idNoHash = crypto.createHash('sha256').update(dto.idNo).digest('hex');

    await this.prisma.student.update({
      where: { id: userId },
      data: {
        realname: dto.name,
        idNoHash,
        idNoEncrypted: this.encryptIdNo(dto.idNo),
        realnameVerified: true,
        ageVerifiedAdult: true,
      },
    });

    return { success: true, message: '实名认证成功' };
  }

  async faceVerify(userId: string, dto: FaceVerifyDto) {
    // 接入人脸核身 SDK（e签宝/腾讯云），此处为桩实现
    return { success: true, faceRef: `face_${Date.now()}` };
  }

  async bindPhone(userId: string, dto: BindPhoneDto) {
    const existing = await this.prisma.student.findUnique({ where: { phone: dto.phone } });
    if (existing && existing.id !== userId) {
      throw new BadRequestException('手机号已被使用');
    }

    await this.prisma.student.update({
      where: { id: userId },
      data: { phone: dto.phone },
    });

    return { success: true };
  }

  async getProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        realname: true,
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: true,
        createdAt: true,
      },
    });
    return student;
  }

  async generateReferralLink(userId: string) {
    const baseUrl = process.env.MINIAPP_BASE_URL || 'https://mp.wangke.com';
    return { link: `${baseUrl}/register?inviter=${userId}`, inviterId: userId };
  }

  private encryptIdNo(idNo: string): string {
    // 生产环境应用 KMS 加密
    return Buffer.from(idNo).toString('base64');
  }
}
