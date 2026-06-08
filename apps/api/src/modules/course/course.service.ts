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

  /** 课程视频列表（从 videoAssetIds 字段派生） */
  async getCourseVideos(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('课程不存在');

    const assetIds = Array.isArray(course.videoAssetIds) ? course.videoAssetIds : [];

    // 将 videoAssetIds 转为带元数据的列表；生产环境可从视频平台 API 拉取真实信息
    return assetIds.map((assetId: any, index: number) => ({
      id: typeof assetId === 'string' ? assetId : `${courseId}-v${index + 1}`,
      title: `第 ${index + 1} 节`,
      duration: null,
      index,
    }));
  }

  /** 获取视频播放地址（生产环境接入防盗链 CDN） */
  async getVideoUrl(videoId: string) {
    // 开发模式返回占位地址；生产接入 VOD 防盗链签名
    return `https://vod.example.com/videos/${videoId}/index.m3u8`;
  }

  /** 课程教师信息（从 teacherInfo 文本解析，生产可改为单独 Teacher 模型） */
  async getTeacherInfo(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { org: { select: { name: true } } },
    });
    if (!course) throw new NotFoundException('课程不存在');

    return {
      name: course.teacherInfo || '授课老师',
      title: `${course.org.name} 讲师`,
      bio: course.teacherInfo,
      phone: null,
      qrCode: null,
    };
  }
}
