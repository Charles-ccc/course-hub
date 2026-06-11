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
  AdminInstitutionQueryDto,
  ApproveInstitutionReqDto,
  CreateInstitutionReqDto,
  SuspendInstitutionReqDto,
  UpdateInstitutionReqDto,
  type InstitutionDto,
} from "./dto/institution.dto";
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
  @Get("institutions")
  getInstitutions(
    @Query() query: AdminInstitutionQueryDto,
  ): Promise<InstitutionDto[]> {
    return this.adminService.getInstitutions(query.status);
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("institutions")
  async createInstitution(
    @Body() body: CreateInstitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.createInstitution(body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Put("institutions/:id")
  async updateInstitution(
    @Param("id") id: string,
    @Body() body: UpdateInstitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.updateInstitution(id, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Delete("institutions/:id")
  async deleteInstitution(@Param("id") id: string): Promise<{ success: true }> {
    await this.adminService.deleteInstitution(id);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("institutions/:id/approve")
  async approveInstitution(
    @Param("id") id: string,
    @Body() body: ApproveInstitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.approveInstitution(id, body);
    return { success: true };
  }

  @UseGuards(SimpleAuthGuard)
  @RequireRole("PLATFORM_ADMIN")
  @Post("institutions/:id/suspend")
  async suspendInstitution(
    @Param("id") id: string,
    @Body() body: SuspendInstitutionReqDto,
  ): Promise<{ success: true }> {
    await this.adminService.suspendInstitution(id, body);
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
