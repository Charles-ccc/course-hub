import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InstitutionService } from "./institution.service";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequireRole } from "../../common/auth/roles.decorator";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import {
  CreateCourseReqDto,
  UpdateCourseStatusReqDto,
  type CourseDto,
} from "./dto/course.dto";
import type { InstitutionDepositDto } from "./dto/deposit.dto";
import { InstitutionOrderQueryDto, type OrderDto } from "./dto/order.dto";
import { WriteoffReqDto, type OverduePeriodDto } from "./dto/overdue.dto";
import {
  InstitutionQuestionQueryDto,
  ReplyQuestionReqDto,
  type QaQuestionDto,
} from "./dto/question.dto";
import type { SettlementRecordDto } from "./dto/settlement.dto";

@Controller("institution")
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Get("deposit")
  getDeposit(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InstitutionDepositDto> {
    return this.institutionService.getDeposit(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Get("orders")
  getOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InstitutionOrderQueryDto,
  ): Promise<OrderDto[]> {
    return this.institutionService.getOrders(user.subject, query.status);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Get("courses")
  getCourses(@CurrentUser() user: AuthenticatedUser): Promise<CourseDto[]> {
    return this.institutionService.getCourses(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Post("courses")
  async createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCourseReqDto,
  ): Promise<{ success: true }> {
    await this.institutionService.createCourse(user.subject, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Patch("courses/:id/status")
  async updateCourseStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateCourseStatusReqDto,
  ): Promise<{ success: true }> {
    await this.institutionService.updateCourseStatus(
      user.subject,
      id,
      body.status,
    );
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Get("overdue/periods")
  getOverdues(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OverduePeriodDto[]> {
    return this.institutionService.getOverdues(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Post("overdue/periods/:id/writeoff")
  async writeoffOverdue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: WriteoffReqDto,
  ): Promise<{ success: true }> {
    await this.institutionService.writeoffOverdue(user.subject, id);
    void body;
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Get("settlements")
  getSettlements(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SettlementRecordDto[]> {
    return this.institutionService.getSettlements(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Get("questions")
  getQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InstitutionQuestionQueryDto,
  ): Promise<QaQuestionDto[]> {
    return this.institutionService.getQuestions(user.subject, query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSTITUTION_ADMIN")
  @Post("questions/:id/reply")
  async replyQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: ReplyQuestionReqDto,
  ): Promise<{ success: true }> {
    await this.institutionService.replyQuestion(user.subject, id, body.content);
    return { success: true };
  }
}
