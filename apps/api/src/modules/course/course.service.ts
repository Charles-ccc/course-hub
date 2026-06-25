import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { buildPageResult } from "../../common/dto/page.dto";
import type {
  CourseDetailDto,
  CourseListDto,
  CourseListQueryDto,
  CourseVideoListDto,
} from "./dto/course.dto";

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CourseListQueryDto): Promise<CourseListDto> {
    const where: Prisma.CourseWhereInput = {
      status: "ONLINE",
      auditStatus: "APPROVED",
    };

    if (query.keyword?.trim()) {
      const kw = query.keyword.trim();
      where.OR = [
        { name: { contains: kw } },
        { description: { contains: kw } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        include: { insitution: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return buildPageResult(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        insitutionName: row.insitution.name,
        priceCents: row.priceCents,
        periodCount: row.periodCount,
        imageUrl: row.imageUrl,
      })),
      total,
      query.page,
      query.pageSize,
    );
  }

  async videos(courseId: string): Promise<CourseVideoListDto> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: "ONLINE", auditStatus: "APPROVED" },
    });
    if (!course) throw new NotFoundException("Course not found");

    const rows = await this.prisma.courseVideo.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((v) => ({
      id: v.id,
      title: v.title,
      durationSec: v.durationSec,
      isTrial: v.isTrial,
      sortOrder: v.sortOrder,
    }));
  }

  async detail(courseId: string): Promise<CourseDetailDto> {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        status: "ONLINE",
        auditStatus: "APPROVED",
      },
      include: { insitution: { select: { name: true } } },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return {
      id: course.id,
      name: course.name,
      insitutionName: course.insitution.name,
      description: course.description,
      instructorInfo: course.instructorInfo,
      outline: course.outline,
      teacherContact: course.teacherContact,
      priceCents: course.priceCents,
      periodCount: course.periodCount,
      imageUrl: course.imageUrl,
    };
  }
}
