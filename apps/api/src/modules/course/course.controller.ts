import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('page') page = '1',
    @Query('size') size = '20',
    @Query('orgId') orgId?: string,
  ) {
    return this.courseService.list({ keyword, page: +page, size: +size, orgId });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.courseService.getDetail(id);
  }

  // 机构端接口
  @Post('org')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('orgId') orgId: string, @Body() dto: any) {
    return this.courseService.create(orgId, dto);
  }

  @Put('org/:id')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: any) {
    return this.courseService.update(orgId, id, dto);
  }
}
