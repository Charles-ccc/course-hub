import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequireRole } from "../../common/auth/roles.decorator";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import {
  type StaffCommissionListDto,
  type StaffCommissionSummaryDto,
  StaffCommissionListQueryDto,
} from "./dto/staff-commission.dto";
import type { StaffProfileDto } from "./dto/staff-profile.dto";
import {
  type StaffStudentListDto,
  StaffStudentListQueryDto,
} from "./dto/staff-student.dto";
import { StaffService } from "./staff.service";

@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(SimpleAuthGuard)
  @RequireRole("STAFF")
  @Get("commission")
  getCommissionSummary(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StaffCommissionSummaryDto> {
    return this.staffService.getCommissionSummary(user.subject);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("STAFF")
  @Get("commissions")
  getCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StaffCommissionListQueryDto,
  ): Promise<StaffCommissionListDto> {
    return this.staffService.getCommissions(user.subject, query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("STAFF")
  @Get("students")
  getStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StaffStudentListQueryDto,
  ): Promise<StaffStudentListDto> {
    return this.staffService.getStudents(user.subject, query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("STAFF")
  @Get("profile")
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<StaffProfileDto> {
    return this.staffService.getProfile(user.subject);
  }
}
