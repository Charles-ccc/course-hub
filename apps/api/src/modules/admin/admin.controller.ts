import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RefreshTokenReqDto } from "../../common/auth/refresh-token.dto";
import { AdminService } from "./admin.service";
import { RequireRole } from "../../common/auth/roles.decorator";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { AdminLoginReqDto, type LoginRespDto } from "./dto/admin-auth.dto";
import type { DashboardHealthDto } from "./dto/dashboard.dto";
import {
  AdminCourseQueryDto,
  CreateCourseReqDto,
  RejectCourseReqDto,
  UpdateCourseReqDto,
  type AdminCourseDto,
} from "./dto/course.dto";
import {
  AdminInsitutionQueryDto,
  ApproveInsitutionReqDto,
  CreateInsitutionReqDto,
  SuspendInsitutionReqDto,
  UpdateInsitutionReqDto,
  type InsitutionDto,
} from "./dto/insitution.dto";
import {
  GmvReportQueryDto,
  type GmvReportDto,
  type OverdueMonitorDto,
} from "./dto/report.dto";
import {
  AdminSalesmanQueryDto,
  CreateSalesmanReqDto,
  type SalesmanDto,
} from "./dto/salesman.dto";
import {
  SettlementQueryDto,
  type SettlementRecordDto,
} from "./dto/settlement.dto";
import {
  UpdateSystemConfigReqDto,
  type SystemConfigDto,
} from "./dto/system-config.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("auth/login")
  login(@Body() body: AdminLoginReqDto): Promise<LoginRespDto> {
    return this.adminService.login(body.username, body.password);
  }

  @Post("auth/refresh")
  refresh(@Body() body: RefreshTokenReqDto): Promise<LoginRespDto> {
    return this.adminService.refreshToken(body.refreshToken);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("dashboard/health")
  getHealth(): Promise<DashboardHealthDto> {
    return this.adminService.getHealth();
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("insitutions")
  getInsitutions(
    @Query() query: AdminInsitutionQueryDto,
  ): Promise<InsitutionDto[]> {
    return this.adminService.getInsitutions(query.status);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("insitutions")
  async createInsitution(
    @Body() body: CreateInsitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.createInsitution(body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Put("insitutions/:id")
  async updateInsitution(
    @Param("id") id: string,
    @Body() body: UpdateInsitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.updateInsitution(id, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Delete("insitutions/:id")
  async deleteInsitution(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.deleteInsitution(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("insitutions/:id/approve")
  async approveInsitution(
    @Param("id") id: string,
    @Body() body: ApproveInsitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.approveInsitution(id, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("insitutions/:id/suspend")
  async suspendInsitution(
    @Param("id") id: string,
    @Body() body: SuspendInsitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.suspendInsitution(id, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("courses")
  getCourses(@Query() query: AdminCourseQueryDto): Promise<AdminCourseDto[]> {
    return this.adminService.getCourses(query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("courses")
  async createCourse(
    @Body() body: CreateCourseReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.createCourse(body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Put("courses/:id")
  async updateCourse(
    @Param("id") id: string,
    @Body() body: UpdateCourseReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.updateCourse(id, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Delete("courses/:id")
  async deleteCourse(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.deleteCourse(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("courses/:id/offline")
  async offlineCourse(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.offlineCourse(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("courses/:id/approve")
  async approveCourse(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.approveCourse(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("courses/:id/reject")
  async rejectCourse(
    @Param("id") id: string,
    @Body() body: RejectCourseReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.rejectCourse(id);
    void body;
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("salesmen")
  getSalesmen(@Query() query: AdminSalesmanQueryDto): Promise<SalesmanDto[]> {
    return this.adminService.getSalesmen(query.status);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("salesmen")
  async createSalesman(
    @Body() body: CreateSalesmanReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.createSalesman(body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("salesmen/:id/disable")
  async disableSalesman(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.disableSalesman(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("reports/gmv")
  getGmvReport(@Query() query: GmvReportQueryDto): Promise<GmvReportDto> {
    return this.adminService.getGmvReport(query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("reports/overdue-monitor")
  getOverdueMonitor(): Promise<OverdueMonitorDto> {
    return this.adminService.getOverdueMonitor();
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("settlements")
  getSettlements(
    @Query() query: SettlementQueryDto,
  ): Promise<SettlementRecordDto[]> {
    return this.adminService.getSettlements(query);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("settlements/:id/execute")
  async executeSettlement(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.executeSettlement(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Get("system-config")
  getSystemConfig(): Promise<SystemConfigDto> {
    return this.adminService.getSystemConfig();
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Put("system-config")
  updateSystemConfig(
    @Body() body: UpdateSystemConfigReqDto,
  ): Promise<SystemConfigDto> {
    return this.adminService.updateSystemConfig(body);
  }
}
