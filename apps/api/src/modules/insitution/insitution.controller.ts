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
import { InsitutionService } from "./insitution.service";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequireRole } from "../../common/auth/roles.decorator";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import {
  CreateCourseReqDto,
  UpdateCourseStatusReqDto,
  type CourseDto,
} from "./dto/course.dto";
import type { InsitutionDepositDto } from "./dto/deposit.dto";
import { InsitutionOrderQueryDto, type OrderDto } from "./dto/order.dto";
import { WriteoffReqDto, type OverduePeriodDto } from "./dto/overdue.dto";
import {
  InsitutionQuestionQueryDto,
  ReplyQuestionReqDto,
  type QaQuestionDto,
} from "./dto/question.dto";
import type { SettlementRecordDto } from "./dto/settlement.dto";

@Controller("insitution")
export class InsitutionController {
  constructor(private readonly insitutionService: InsitutionService) {}

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Get("deposit")
  getDeposit(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InsitutionDepositDto> {
    return this.insitutionService.getDeposit(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Get("orders")
  getOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InsitutionOrderQueryDto,
  ): Promise<OrderDto[]> {
    return this.insitutionService.getOrders(user.subject, query.status);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Get("courses")
  getCourses(@CurrentUser() user: AuthenticatedUser): Promise<CourseDto[]> {
    return this.insitutionService.getCourses(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Post("courses")
  async createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCourseReqDto,
  ): Promise<{ success: true }> {
    await this.insitutionService.createCourse(user.subject, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Patch("courses/:id/status")
  async updateCourseStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateCourseStatusReqDto,
  ): Promise<{ success: true }> {
    await this.insitutionService.updateCourseStatus(
      user.subject,
      id,
      body.status,
    );
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Get("overdue/periods")
  getOverdues(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OverduePeriodDto[]> {
    return this.insitutionService.getOverdues(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Post("overdue/periods/:id/writeoff")
  async writeoffOverdue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: WriteoffReqDto,
  ): Promise<{ success: true }> {
    await this.insitutionService.writeoffOverdue(user.subject, id);
    void body;
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Get("settlements")
  getSettlements(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SettlementRecordDto[]> {
    return this.insitutionService.getSettlements(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Get("questions")
  getQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InsitutionQuestionQueryDto,
  ): Promise<QaQuestionDto[]> {
    return this.insitutionService.getQuestions(user.subject, query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("INSITUTION_ADMIN")
  @Post("questions/:id/reply")
  async replyQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: ReplyQuestionReqDto,
  ): Promise<{ success: true }> {
    await this.insitutionService.replyQuestion(user.subject, id, body.content);
    return { success: true };
  }
}
