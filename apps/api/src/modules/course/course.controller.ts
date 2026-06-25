import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from "@nestjs/common";
import { CourseService } from "./course.service";
import {
  CourseListQueryDto,
  type CourseDetailDto,
  type CourseListDto,
  type CourseVideoListDto,
} from "./dto/course.dto";

@Controller("courses")
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  list(@Query() query: CourseListQueryDto): Promise<CourseListDto> {
    return this.courseService.list(query);
  }

  // 具体路由必须在通配 :courseId 之前注册
  @Get("videos/:videoId/url")
  videoUrl(): never {
    throw new HttpException(
      { code: 50100, message: "视频播放功能即将上线，敬请期待" },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Get(":courseId/videos")
  videos(@Param("courseId") courseId: string): Promise<CourseVideoListDto> {
    return this.courseService.videos(courseId);
  }

  @Get(":courseId")
  detail(@Param("courseId") courseId: string): Promise<CourseDetailDto> {
    return this.courseService.detail(courseId);
  }
}
