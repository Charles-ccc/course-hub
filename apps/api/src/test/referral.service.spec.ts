import { Test, TestingModule } from "@nestjs/testing";
import { ReferralService } from "../modules/referral/referral.service";
import { PrismaService } from "../common/prisma/prisma.service";

const mockPrisma = {
  student: { findUnique: jest.fn() },
  referralReward: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  staff: { findUnique: jest.fn() },
};

const GROSS = 5000;
const TAX = 1000; // 20%
const NET = 4000;

describe("ReferralService — 单级拉新与税务", () => {
  let service: ReferralService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ReferralService>(ReferralService);
    jest.clearAllMocks();
  });

  it("被邀请人有邀请人时触发奖励，扣 20% 个税", async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: "inv-ee",
      referrerStudentId: "inv-er",
    });
    mockPrisma.referralReward.findFirst.mockResolvedValue(null);
    mockPrisma.referralReward.create.mockResolvedValue({});

    await service.triggerReward("inv-ee", "ord-1");

    expect(mockPrisma.referralReward.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inviterStudentId: "inv-er",
          grossAmount: GROSS,
          taxWithheld: TAX,
          netAmount: NET,
          trigger: "invitee_first_repayment",
        }),
      }),
    );
  });

  it("同一订单不重复发奖（防刷）", async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: "inv-ee",
      referrerStudentId: "inv-er",
    });
    mockPrisma.referralReward.findFirst.mockResolvedValue({ id: "existing" }); // 已存在

    await service.triggerReward("inv-ee", "ord-1");
    expect(mockPrisma.referralReward.create).not.toHaveBeenCalled();
  });

  it("没有邀请人的学员不触发奖励", async () => {
    mockPrisma.student.findUnique.mockResolvedValue({
      id: "inv-ee",
      referrerStudentId: null,
    });

    await service.triggerReward("inv-ee", "ord-1");
    expect(mockPrisma.referralReward.create).not.toHaveBeenCalled();
  });

  it("邀请人同时是业务员（同手机号）→ 拒绝学员拉新奖励（防多级/双重身份）", async () => {
    mockPrisma.student.findUnique
      .mockResolvedValueOnce({
        id: "inv-ee",
        referrerStudentId: "inv-er",
      })
      .mockResolvedValueOnce({
        // inviterIsAlsoStaff 二次查询
        phone: "13800000000",
      });
    mockPrisma.staff.findUnique.mockResolvedValue({
      id: "staff-x",
      phone: "13800000000",
    });

    await service.triggerReward("inv-ee", "ord-1");
    expect(mockPrisma.referralReward.create).not.toHaveBeenCalled();
  });
});
