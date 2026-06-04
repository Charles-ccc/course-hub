import { Test, TestingModule } from "@nestjs/testing";
import { OrderService } from "../modules/order/order.service";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

const mockPrisma = {
  student: { findUnique: jest.fn() },
  course: { findUnique: jest.fn() },
  order: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  contract: { create: jest.fn() },
  staff: { findUnique: jest.fn() },
  commission: { deleteMany: jest.fn() },
  referralReward: { deleteMany: jest.fn() },
};

describe("OrderService", () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    it("未实名学员应拒绝下单", async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: "s1",
        realnameVerified: false,
        ageVerifiedAdult: false,
      });
      await expect(
        service.createOrder("s1", { courseId: "c1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("课程不存在应返回 404", async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: "s1",
        realnameVerified: true,
        ageVerifiedAdult: true,
      });
      mockPrisma.course.findUnique.mockResolvedValue(null);
      await expect(
        service.createOrder("s1", { courseId: "c1" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("超出客单价上限应拒绝下单（错误码 40002）", async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: "s1",
        realnameVerified: true,
        ageVerifiedAdult: true,
      });
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "c1",
        orgId: "o1",
        price: 9999999,
        periodCount: 12,
        status: "ONLINE",
        org: { name: "测试机构" },
      });
      await expect(
        service.createOrder("s1", { courseId: "c1" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("合规：seller_org_id 必须等于课程机构 ID", async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: "s1",
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: null,
      });
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "c1",
        orgId: "org-001",
        price: 50000,
        periodCount: 5,
        status: "ONLINE",
        org: { name: "测试机构" },
      });
      mockPrisma.order.create.mockResolvedValue({
        id: "ord-1",
        sellerOrgId: "org-001",
        totalAmount: 50000,
      });

      const order = await service.createOrder("s1", { courseId: "c1" });
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sellerOrgId: "org-001" }),
        }),
      );
      expect(order.sellerOrgId).toBe("org-001");
    });
  });

  describe("coolingOffRefund", () => {
    it("冷静期内可退课", async () => {
      const future = new Date(Date.now() + 86400000 * 5);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        studentId: "s1",
        status: "COOLING_OFF",
        coolingOffDeadline: future,
      });
      mockPrisma.order.update.mockResolvedValue({
        id: "ord-1",
        status: "REFUNDED",
      });
      const result = await service.coolingOffRefund("s1", "ord-1");
      expect(result.success).toBe(true);
    });

    it("非冷静期状态不可退", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        studentId: "s1",
        status: "ACTIVE",
      });
      await expect(service.coolingOffRefund("s1", "ord-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("冷静期已过不可退", async () => {
      const past = new Date(Date.now() - 86400000);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        studentId: "s1",
        status: "COOLING_OFF",
        coolingOffDeadline: past,
      });
      await expect(service.coolingOffRefund("s1", "ord-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("冷静期退课应级联取消未结算的提成与拉新奖励", async () => {
      const future = new Date(Date.now() + 86400000 * 3);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "ord-1",
        studentId: "s1",
        status: "COOLING_OFF",
        coolingOffDeadline: future,
      });
      mockPrisma.order.update.mockResolvedValue({
        id: "ord-1",
        status: "REFUNDED",
      });
      mockPrisma.commission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.referralReward.deleteMany.mockResolvedValue({ count: 1 });

      await service.coolingOffRefund("s1", "ord-1");

      expect(mockPrisma.commission.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orderId: "ord-1" }),
        }),
      );
      expect(mockPrisma.referralReward.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderId: "ord-1",
            status: "PENDING",
          }),
        }),
      );
    });
  });

  describe("Staff self-buy 拦截", () => {
    it("业务员与学员同手机号下单时，attribution 必须置空（不计提成）", async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: "s1",
        phone: "13800000000",
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: "staff-1",
      });
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "c1",
        orgId: "org-001",
        price: 50000,
        periodCount: 5,
        status: "ONLINE",
        org: { name: "测试机构" },
      });
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: "staff-1",
        phone: "13800000000", // ★ 同手机号
      });
      mockPrisma.order.create.mockResolvedValue({
        id: "ord-2",
        sellerOrgId: "org-001",
        attributionStaffId: null,
      });

      await service.createOrder("s1", { courseId: "c1" });
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ attributionStaffId: null }),
        }),
      );
    });

    it("业务员与学员不同手机号时，attribution 正常保留", async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: "s1",
        phone: "13800000000",
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: "staff-1",
      });
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "c1",
        orgId: "org-001",
        price: 50000,
        periodCount: 5,
        status: "ONLINE",
        org: { name: "测试机构" },
      });
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: "staff-1",
        phone: "13900000000",
      });
      mockPrisma.order.create.mockResolvedValue({
        id: "ord-3",
        sellerOrgId: "org-001",
        attributionStaffId: "staff-1",
      });

      await service.createOrder("s1", { courseId: "c1" });
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ attributionStaffId: "staff-1" }),
        }),
      );
    });
  });
});
