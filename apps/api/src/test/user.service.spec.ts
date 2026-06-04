import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../modules/user/user.service';
import { RealnameService } from '../modules/user/realname.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  student: { findUnique: jest.fn(), update: jest.fn() },
};

const mockRealnameService = {
  verifyFourElements: jest.fn(),
};

describe('UserService — 实名与未成年拦截', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealnameService, useValue: mockRealnameService },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('未成年用户（<18）实名时应硬拦截（错误码 40001）', async () => {
    mockRealnameService.verifyFourElements.mockResolvedValue({ success: true, age: 16 });

    const err = await service.verifyRealname('user-1', {
      name: '小明', idNo: '110101200901011234', phone: '13800000001',
    }).catch(e => e);

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.response.code).toBe(40001);
  });

  it('18岁以上实名成功应写入验证标志', async () => {
    mockRealnameService.verifyFourElements.mockResolvedValue({ success: true, age: 22 });
    mockPrisma.student.update.mockResolvedValue({});

    const result = await service.verifyRealname('user-1', {
      name: '张三', idNo: '110101200201011234', phone: '13800000002',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.student.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ realnameVerified: true, ageVerifiedAdult: true }),
      })
    );
  });

  it('实名认证失败不应写入数据库', async () => {
    mockRealnameService.verifyFourElements.mockResolvedValue({ success: false, age: 0 });

    await service.verifyRealname('user-1', {
      name: '张三', idNo: '110101200201011234', phone: '13800000003',
    }).catch(() => {});

    expect(mockPrisma.student.update).not.toHaveBeenCalled();
  });
});
