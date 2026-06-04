import { Test, TestingModule } from "@nestjs/testing";
import { DeductionService } from "../modules/installment/deduction.service";
import { PrismaService } from "../common/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

const mockPrisma = {
  installmentItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  deduction: { create: jest.fn(), update: jest.fn(), count: jest.fn() },
};

describe("DeductionService — 先交付后扣款合规校验", () => {
  let service: DeductionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeductionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<DeductionService>(DeductionService);
    jest.clearAllMocks();
  });

  it("内容未交付时触发代扣应拒绝（错误码 42201）", async () => {
    mockPrisma.installmentItem.findUnique.mockResolvedValue({
      id: "item-1",
      orderId: "ord-1",
      periodNo: 1,
      actualAmount: 10000,
      status: "PENDING",
      contentDeliveredAt: null, // ★ 未交付
      order: { sellerOrgId: "org-1", sellerOrg: { name: "测试机构" } },
    });

    const err = await service.triggerDeduction("item-1").catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    const codeOrMsg = err.response?.code ?? err.response?.message ?? "";
    expect(String(codeOrMsg)).toMatch(/42201|当期内容未交付/);
  });

  it("已支付的期不重复扣款", async () => {
    mockPrisma.installmentItem.findUnique.mockResolvedValue({
      id: "item-2",
      contentDeliveredAt: new Date(),
      status: "PAID",
      order: { sellerOrgId: "org-1" },
    });

    const result = await service.triggerDeduction("item-2");
    expect(result.message).toMatch(/已支付/);
    expect(mockPrisma.deduction.create).not.toHaveBeenCalled();
  });

  it("代扣时 payeeOrgId 必须是机构（合规约束）", async () => {
    mockPrisma.installmentItem.findUnique.mockResolvedValue({
      id: "item-3",
      orderId: "ord-1",
      periodNo: 1,
      actualAmount: 10000,
      status: "DELIVERED",
      contentDeliveredAt: new Date(),
      order: { sellerOrgId: "org-001", sellerOrg: { name: "测试机构" } },
    });
    mockPrisma.deduction.create.mockResolvedValue({ id: "ded-1" });
    mockPrisma.deduction.update.mockResolvedValue({
      id: "ded-1",
      status: "SUCCESS",
    });
    mockPrisma.installmentItem.update.mockResolvedValue({});

    await service.triggerDeduction("item-3");

    expect(mockPrisma.deduction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ payeeOrgId: "org-001" }),
      }),
    );
  });

  describe("D+1/D+3/D+7 重试调度", () => {
    it("仅在 D+1 / D+3 / D+7 重试窗口才发起代扣", async () => {
      const today = new Date();
      const mk = (days: number) => ({
        id: `item-${days}`,
        orderId: "ord-1",
        periodNo: 1,
        actualAmount: 10000,
        status: "DELIVERED",
        contentDeliveredAt: new Date(),
        dueDate: new Date(today.getTime() - days * 86400000),
        order: { sellerOrgId: "org-001", sellerOrg: { name: "x" } },
      });

      mockPrisma.installmentItem.findMany.mockResolvedValue([
        mk(1),
        mk(2),
        mk(3),
        mk(5),
        mk(7),
      ]);
      const spy = jest.spyOn(service, "triggerDeduction").mockResolvedValue({
        success: true,
      } as any);

      await service.retryOverdueDeductions();

      // D+1 / D+3 / D+7 命中 → 3 次
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith("item-1");
      expect(spy).toHaveBeenCalledWith("item-3");
      expect(spy).toHaveBeenCalledWith("item-7");
      spy.mockRestore();
    });

    it("累计 4 次失败（首扣 + D+1 + D+3 + D+7）才落定 OVERDUE", async () => {
      mockPrisma.installmentItem.findUnique.mockResolvedValue({
        id: "item-x",
        orderId: "ord-1",
        periodNo: 1,
        actualAmount: 10000,
        status: "DELIVERED",
        contentDeliveredAt: new Date(),
        order: { sellerOrgId: "org-001", sellerOrg: { name: "x" } },
      });
      mockPrisma.deduction.create.mockResolvedValue({ id: "ded-x" });
      mockPrisma.deduction.update.mockResolvedValue({});

      // 模拟通道全部失败
      (service as any).callPaymentChannel = jest.fn().mockResolvedValue(false);

      // 第 3 次失败 → 还不应标 OVERDUE
      mockPrisma.deduction.count.mockResolvedValueOnce(3);
      mockPrisma.installmentItem.update.mockClear();
      await service.triggerDeduction("item-x").catch(() => {});
      const overdueCalls = mockPrisma.installmentItem.update.mock.calls.filter(
        ([arg]) => arg?.data?.status === "OVERDUE",
      );
      expect(overdueCalls.length).toBe(0);

      // 第 4 次失败 → 落定 OVERDUE
      mockPrisma.deduction.count.mockResolvedValueOnce(4);
      mockPrisma.installmentItem.update.mockClear();
      await service.triggerDeduction("item-x").catch(() => {});
      const overdueCalls2 = mockPrisma.installmentItem.update.mock.calls.filter(
        ([arg]) => arg?.data?.status === "OVERDUE",
      );
      expect(overdueCalls2.length).toBe(1);
    });
  });
});
