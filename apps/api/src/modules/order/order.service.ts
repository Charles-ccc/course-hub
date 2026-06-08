import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderStatus } from "@prisma/client";
import * as dayjs from "dayjs";

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(studentId: string, dto: CreateOrderDto) {
    // 1. 检查学员是否已实名+成年
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student?.realnameVerified || !student?.ageVerifiedAdult) {
      throw new ForbiddenException({
        code: 40001,
        message: "请先完成实名认证",
      });
    }

    // 2. 获取课程信息
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { org: true },
    });
    if (!course || course.status !== "ONLINE") {
      throw new NotFoundException("课程不存在或已下线");
    }

    // 3. 客单价上限校验
    const config = await this.getPriceCapConfig();
    if (course.price > config.maxOrderAmount) {
      throw new BadRequestException({ code: 40002, message: "超出客单价上限" });
    }

    // 4. 创建订单（seller = 机构）
    //    ★ Staff self-buy 防护：若 referrerStaff 与学员同手机号，归属置空（不计提成）
    let attributionStaffId: string | null = student.referrerStaffId || null;
    if (attributionStaffId && student.phone) {
      const staff = await this.prisma.staff?.findUnique?.({
        where: { id: attributionStaffId },
      });
      if (staff?.phone && staff.phone === student.phone) {
        attributionStaffId = null;
      }
    }

    const order = await this.prisma.order.create({
      data: {
        studentId,
        courseId: dto.courseId,
        sellerOrgId: course.orgId,
        attributionStaffId,
        totalAmount: course.price,
        periodCount: course.periodCount,
        periodAmount: Math.ceil(course.price / course.periodCount),
        status: OrderStatus.CREATED,
        invoiceSubject: course.org.name,
      },
    });

    return order;
  }

  async signContract(studentId: string, orderId: string) {
    const order = await this.findStudentOrder(studentId, orderId);

    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException("订单状态不允许签约");
    }

    const coolingOffDeadline = dayjs().add(7, "day").toDate();

    // 创建合同记录（甲方 = 机构）
    const contract = await this.prisma.contract.create({
      data: {
        orderId: order.id,
        partyAOrgId: order.sellerOrgId,
        partyBStudentId: studentId,
        templateId: "default_installment_template",
        esignProvider: "esign",
      },
    });

    // 更新订单进入冷静期
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COOLING_OFF,
        contractId: contract.id,
        coolingOffDeadline,
      },
    });

    return updated;
  }

  async coolingOffRefund(studentId: string, orderId: string) {
    const order = await this.findStudentOrder(studentId, orderId);

    if (order.status !== OrderStatus.COOLING_OFF) {
      throw new BadRequestException("不在冷静期内，无法无条件退课");
    }

    if (dayjs().isAfter(order.coolingOffDeadline)) {
      throw new BadRequestException("冷静期已结束");
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    // ★ 级联：冷静期退课 → 取消所有尚未结算的提成与拉新奖励
    //   - 已 SETTLED / PAID 的不动（理论上冷静期内不会发生）
    //   - 已 HELD 的也回滚（订单作废，业务员无履约可言）
    await this.prisma.commission?.deleteMany?.({
      where: { orderId, status: { in: ["PENDING", "HELD"] as any } },
    });
    await this.prisma.referralReward?.deleteMany?.({
      where: { orderId, status: "PENDING" as any },
    });

    return { success: true, message: "退课成功，款项将退回原支付渠道" };
  }

  async listStudentOrders(studentId: string) {
    return this.prisma.order.findMany({
      where: { studentId },
      include: {
        course: { select: { title: true } },
        sellerOrg: { select: { name: true } },
        installmentItems: { orderBy: { periodNo: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrderDetail(studentId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        course: true,
        sellerOrg: { select: { id: true, name: true } },
        installmentItems: { orderBy: { periodNo: "asc" } },
        contract: true,
      },
    });

    if (!order || order.studentId !== studentId) {
      throw new NotFoundException("订单不存在");
    }

    return order;
  }

  /** 法大大 / e签宝 签约入口（开发阶段直接激活订单） */
  async signWithProvider(studentId: string, orderId: string, provider: 'fadadada' | 'eqianbao') {
    const order = await this.findStudentOrder(studentId, orderId);

    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException('订单状态不允许签约');
    }

    // 创建合同记录
    const contract = await this.prisma.contract.create({
      data: {
        orderId: order.id,
        partyAOrgId: order.sellerOrgId,
        partyBStudentId: studentId,
        templateId: 'default_installment_template',
        esignProvider: provider,
        signedAt: new Date(),
      },
    });

    // 签约完成直接进入 ACTIVE（跳过冷静期）
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.ACTIVE,
        contractId: contract.id,
      },
    });

    const signUrl = `https://mock-${provider}.wangke.com/sign/${orderId}`;
    return { success: true, signUrl, order: updated };
  }

  async getSignStatus(studentId: string, orderId: string) {
    const order = await this.findStudentOrder(studentId, orderId);
    return {
      signed: order.status !== OrderStatus.CREATED,
      status: order.status,
    };
  }

  async activateCoolingOffOrders() {
    const now = new Date();
    await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.COOLING_OFF,
        coolingOffDeadline: { lte: now },
      },
      data: { status: OrderStatus.ACTIVE },
    });
  }

  private async findStudentOrder(studentId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.studentId !== studentId) {
      throw new NotFoundException("订单不存在");
    }
    return order;
  }

  private async getPriceCapConfig() {
    return { maxOrderAmount: 1000000 }; // 分，即 10000 元，可从配置表读取
  }
}
