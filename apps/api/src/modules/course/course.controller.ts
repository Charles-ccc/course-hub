import { Controller, Get, Param, Query } from "@nestjs/common";
import { CourseService } from "./course.service";
import {
  CourseListQueryDto,
  type CourseDetailDto,
  type CourseListDto,
} from "./dto/course.dto";

@Controller("courses")
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  list(@Query() query: CourseListQueryDto): Promise<CourseListDto> {
    return this.courseService.list(query);
  }

  @Get(":courseId")
  detail(@Param("courseId") courseId: string): Promise<CourseDetailDto> {
    return this.courseService.detail(courseId);
  }
}
