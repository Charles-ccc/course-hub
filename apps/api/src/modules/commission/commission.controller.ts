import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/staff')
@UseGuards(JwtAuthGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('profile')
  myProfile(@CurrentUser() staff: any) {
    return this.commissionService.getStaffProfile(staff.id);
  }

  @Get('commission')
  myCommission(@CurrentUser('id') staffId: string) {
    return this.commissionService.getStaffDashboard(staffId);
  }

  @Get('students')
  myStudents(@CurrentUser('id') staffId: string, @Query('page') page = '1') {
    return this.commissionService.getStaffStudents(staffId, +page);
  }
}

@Controller('v1/admin/staff')
@UseGuards(JwtAuthGuard)
export class AdminStaffController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  list(@Query('page') page = '1', @Query('size') size = '20') {
    return this.commissionService.adminListStaff(+page, +size);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string) {
    return this.commissionService.disableStaff(id);
  }
}
