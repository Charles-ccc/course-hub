import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async list(params: { keyword?: string; page: number; size: number; orgId?: string }) {
    const { keyword, page, size, orgId } = params;
    const where = {
      // 机构管理查询（有 orgId）时不限制状态，公开搜索只返回 ONLINE
      ...(orgId ? { orgId } : { status: 'ONLINE' as const }),
      ...(keyword && { title: { contains: keyword } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: { org: { select: { id: true, name: true } } },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { items, total, page, size, totalPages: Math.ceil(total / size) };
  }

  async getDetail(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { org: { select: { id: true, name: true, alipayMerchantId: true } } },
    });

    if (!course || course.status !== 'ONLINE') {
      throw new NotFoundException('课程不存在或已下线');
    }

    return course;
  }

  async create(orgId: string, dto: any) {
    return this.prisma.course.create({
      data: {
        orgId,
        title: dto.title,
        outline: dto.outline,
        teacherInfo: dto.teacherInfo,
        videoAssetIds: dto.videoAssetIds || [],
        price: dto.price,
        periodCount: dto.periodCount,
        reviewPeriodDays: dto.reviewPeriodDays || 180,
        status: 'OFFLINE',
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.orgId !== orgId) {
      throw new ForbiddenException('无权操作此课程');
    }

    return this.prisma.course.update({ where: { id }, data: dto });
  }
}
