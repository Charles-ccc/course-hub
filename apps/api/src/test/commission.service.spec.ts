import { Test, TestingModule } from "@nestjs/testing";
import { CommissionService } from "../modules/commission/commission.service";
import { PrismaService } from "../common/prisma/prisma.service";

const mockPrisma = {
  commission: { create: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
  student: { findMany: jest.fn(), count: jest.fn() },
  order: { findUnique: jest.fn() },
  staff: { findUnique: jest.fn() },
};

describe("CommissionService — 单级提成规则", () => {
  let service: CommissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CommissionService>(CommissionService);
    jest.clearAllMocks();
  });

  it("成单提成按总价 * rate 计算", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: "ord-1",
      student: { phone: "13800000000" },
    });
    mockPrisma.staff.findUnique.mockResolvedValue({
      id: "staff-1",
      phone: "13900000000", // 不同手机号
    });
    await service.createClosingCommission("ord-1", "staff-1", 100000, 0.03);
    expect(mockPrisma.commission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 3000, type: "CLOSING" }),
      }),
    );
  });

  it("Staff self-buy（业务员与学员同手机号）不计成单提成", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: "ord-1",
      student: { phone: "13800000000" },
    });
    mockPrisma.staff.findUnique.mockResolvedValue({
      id: "staff-1",
      phone: "13800000000", // ★ 同手机号
    });
    await service.createClosingCommission("ord-1", "staff-1", 100000, 0.03);
    expect(mockPrisma.commission.create).not.toHaveBeenCalled();
  });

  it("还款成功后应结算当期履约提成", async () => {
    await service.settleOnPayment("ord-1", 2);
    expect(mockPrisma.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orderId: "ord-1",
          periodNo: 2,
          type: "PERFORMANCE",
        }),
      }),
    );
  });

  it("逾期应暂缓当期履约提成", async () => {
    await service.holdOnOverdue("ord-1", 3);
    expect(mockPrisma.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ periodNo: 3 }),
        data: expect.objectContaining({ status: "HELD" }),
      }),
    );
  });

  it("连续逾期 >60天 应扣回成单提成", async () => {
    await service.clawBackIfExtendedOverdue("ord-1");
    expect(mockPrisma.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CLAWED_BACK" }),
      }),
    );
  });
});
